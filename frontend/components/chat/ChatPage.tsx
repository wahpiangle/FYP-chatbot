'use client';
import Chatbox from '../chatbox/chatbox'
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from '../ui/use-toast';
import { useRouter } from 'next/navigation';
import MessageDialog from './message-dialog';
import API_URL from '@/constants';
import { ChatMessage } from '@/types/types';
import { Spinner } from '../ui/spinner';

export default function ChatPage() {
    const [pendingMessage, setPendingMessage] = useState('');
    const [inputText, setInputText] = useState('')
    const router = useRouter();
    const chatHistoryQuery = useQuery({
        queryKey: ['chatHistory'],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/chat`, {
                withCredentials: true,
            })
            const chatMessages: ChatMessage[] = response.data.map((message: any) => ({
                message: message.content,
                fromServer: message.role === 'assistant',
            }))
            return chatMessages;
        },
    })
    const useChat = useMutation({
        mutationFn: (input: String) => {
            return axios.post(
                `${API_URL}/chat`, {
                inputText: input
            },
                {
                    withCredentials: true,
                }
            )
        }
    })
    const handleSubmit = async () => {
        setPendingMessage(inputText);
        setInputText('');
        try {
            const response = await useChat.mutateAsync(inputText);
            chatHistoryQuery.refetch();
        } catch (error: any) {
            if (error.status === 401) {
                router.push('/login')
                return
            }
            toast({
                title: "Error",
                description: "Failed to fetch response.",
                variant: "destructive",
            })
        } finally {
            setPendingMessage('');
        }
    };

    return (
        <main className="flex-1 gap-4 overflow-auto p-4 ">
            <div className="flex flex-col rounded-xl 0 lg:col-span-2 h-full justify-between gap-4">
                <div className="flex flex-col gap-4 max-w-full overflow-auto px-1">
                    {chatHistoryQuery.isLoading ? (
                        <div className="flex items-center justify-center">
                            <Spinner />
                        </div>
                    ) : chatHistoryQuery.isError ? (
                        <h2 className="text-2xl text-center">Error loading chat history</h2>
                    ) : (chatHistoryQuery.data?.length ?? 0) === 0 && pendingMessage === '' ? (
                        <h2 className="text-2xl text-center">Ask me anything!</h2>
                    ) : (
                        chatHistoryQuery?.data?.map((chat, index) => (
                            <MessageDialog key={index} chat={chat} />
                        ))
                    )}

                    {useChat.isPending && (
                        <>
                            <MessageDialog
                                chat={{ message: pendingMessage, fromServer: false }}
                            />
                            <MessageDialog
                                chat={{ message: '', fromServer: true, loading: true }}
                            />
                        </>
                    )}
                </div>

                <Chatbox
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSubmit={handleSubmit}
                />
            </div>
        </main>
    )
}
