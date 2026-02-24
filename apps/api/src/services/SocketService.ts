import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
    private io: SocketIOServer | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
            }
        });

        this.io.on('connection', (socket: Socket) => {
            console.log(`[Socket] Client connected: ${socket.id}`);

            // When a client connects, they must provide their tenant ID
            // to join the correct room. This prevents leaking messages across tenants.
            socket.on('join_tenant', (tenantId: string) => {
                if (!tenantId) return;
                socket.join(`tenant_${tenantId}`);
                console.log(`[Socket] Client ${socket.id} joined tenant room: tenant_${tenantId}`);
            });

            socket.on('leave_tenant', (tenantId: string) => {
                if (!tenantId) return;
                socket.leave(`tenant_${tenantId}`);
                console.log(`[Socket] Client ${socket.id} left tenant room: tenant_${tenantId}`);
            });

            socket.on('disconnect', () => {
                console.log(`[Socket] Client disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Emits a new message event to all connected clients for a specific tenant.
     * @param tenantId The ID of the tenant
     * @param sessionId The ID of the session the message belongs to
     * @param message The message object
     */
    public emitNewMessage(tenantId: string, sessionId: string, message: any) {
        if (!this.io) {
            console.warn('[Socket] Attempted to emit before io initialization.');
            return;
        }
        this.io.to(`tenant_${tenantId}`).emit('new_message', {
            sessionId,
            message
        });
    }

    /**
    * Emits a general session update event (e.g., mood change, read status)
    * @param tenantId The ID of the tenant
    * @param session The updated session object
    */
    public emitSessionUpdate(tenantId: string, session: any) {
        if (!this.io) {
            console.warn('[Socket] Attempted to emit before io initialization.');
            return;
        }
        this.io.to(`tenant_${tenantId}`).emit('session_update', {
            session
        });
    }
}

export const socketService = SocketService.getInstance();
