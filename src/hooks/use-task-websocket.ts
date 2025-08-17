import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types/task";

type TaskWebSocketEvent = {
  type: "TASK_UPDATED" | "TASK_DELETED";
  projectId: string;
  taskId: string;
  data?: Task;
};

const RECONNECT_DELAY = 3000; // 3 seconds

export function useTaskWebSocket(projectId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    cleanup();

    try {
      wsRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/tasks`);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "SUBSCRIBE", projectId }));
        }
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        try {
          const data: TaskWebSocketEvent = JSON.parse(event.data);

          switch (data.type) {
            case "TASK_UPDATED":
              queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
              break;

            case "TASK_DELETED":
              queryClient.setQueryData<Task[]>(
                ["tasks", projectId],
                (oldData) => {
                  if (!oldData) return oldData;
                  return oldData.filter((task) => task.id !== data.taskId);
                }
              );
              break;
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (event: Event) => {
        console.error("WebSocket error:", event);
        reconnectTimeoutRef.current = setTimeout(
          connectWebSocket,
          RECONNECT_DELAY
        );
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        reconnectTimeoutRef.current = setTimeout(
          connectWebSocket,
          RECONNECT_DELAY
        );
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      reconnectTimeoutRef.current = setTimeout(
        connectWebSocket,
        RECONNECT_DELAY
      );
    }
  }, [projectId, queryClient, cleanup]);

  useEffect(() => {
    connectWebSocket();
    return cleanup;
  }, [connectWebSocket, cleanup]);

  return null;
}
