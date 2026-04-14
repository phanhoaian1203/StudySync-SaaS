import * as signalR from '@microsoft/signalr';

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private startPromise: Promise<signalR.HubConnection | null> | null = null;

    async startConnection(boardId: string) {
        // Nếu đã kết nối rồi và vẫn đang hoạt động, chỉ cần join board mới
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke('JoinBoard', boardId);
                return this.connection;
            } catch (err) {
                console.warn('Failed to join board on existing connection, will try reconnecting...', err);
            }
        }

        // Nếu đang trong quá trình kết nối thì đợi promise đó xong
        if (this.startPromise) {
            return this.startPromise;
        }

        this.startPromise = (async () => {
            try {
                // Dừng kết nối cũ nếu có (và không ở trạng thái Disconnected)
                if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
                    await this.stopConnection();
                }

                this.connection = new signalR.HubConnectionBuilder()
                    .withUrl(`${import.meta.env.VITE_API_URL}/hubs/board`, {
                        accessTokenFactory: () => localStorage.getItem('studySync_token') || ''
                    })
                    // Custom Logger để lọc bỏ các log lỗi vô hại trong quá trình negotiation/vòng đời React
                    .configureLogging({
                        log: (level, message) => {
                            // Bỏ qua các message lỗi gây ra bởi việc chủ động dừng kết nối (thường do React Strict Mode hoặc chuyển hướng nhanh)
                            const isBenign = 
                                message.includes('stopped during negotiation') || 
                                message.includes('aborted') || 
                                message.includes('connection was closed') ||
                                message.includes('Failed to start the connection');

                            if (isBenign) return; 

                            // Chỉ log các Warning hoặc Error thực sự quan trọng
                            if (level >= signalR.LogLevel.Error) {
                                console.error(`[SignalR Error] ${message}`);
                            } else if (level >= signalR.LogLevel.Warning) {
                                console.warn(`[SignalR Warning] ${message}`);
                            }
                        }
                    })
                    .withAutomaticReconnect()
                    .build();

                await this.connection.start();
                console.log('SignalR Connected to Board:', boardId);
                await this.connection.invoke('JoinBoard', boardId);
                return this.connection;
            } catch (err: any) {
                // Không log Error ở đây nếu lỗi là do abort/stop (đã được xử lý bởi custom logger)
                // Tuy nhiên ta vẫn giữ logic catch để trả về null thay vì throw exception ra ngoài component
                return null;
            } finally {
                this.startPromise = null;
            }
        })();

        return this.startPromise;
    }

    async stopConnection() {
        if (!this.connection) return;
        
        const state = this.connection.state;
        if (state !== signalR.HubConnectionState.Disconnected && state !== signalR.HubConnectionState.Disconnecting) {
            try {
                await this.connection.stop();
            } catch (err) {
                // Silent stop
            }
        }
        this.connection = null;
    }

    onUpdate(callback: (action: string, data: any) => void) {
        if (!this.connection) return;
        
        // Đảm bảo không đăng ký trùng lặp
        this.connection.off('ReceiveTaskUpdate');
        this.connection.on('ReceiveTaskUpdate', (update: { action: string, data: any }) => {
            callback(update.action, update.data);
        });
    }
}

export const signalRService = new SignalRService();
