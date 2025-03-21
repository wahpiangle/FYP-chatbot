'use client';
import {
    Sidebar,
} from "lucide-react"

import { SheetContent, SheetTrigger, Sheet } from "@/components/ui/sheet"
import NavContent from "@/components/nav/nav-content"
import ChatPage from "@/components/chat/ChatPage"
import { Button } from "@/components/ui/button"
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import withAuth from "@/components/hoc/withAuth";
const Dashboard = () => {
    const { user, login, logout } = useContext(AuthContext);
    return (
        <div className="flex flex-col dark:bg-darkSecondary h-full">
            <header className="sticky flex items-center justify-between shadow-md dark:shadow-none px-4 py-2 dark:border-none">
                <Sheet>
                    <SheetTrigger className="sm:hidden">
                        <Sidebar className="size-5" />
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 dark:bg-darkSecondary border-r-0 px-4 py-2">
                        <NavContent />
                    </SheetContent>
                </Sheet>
                {
                    user &&
                    <Button className="hidden sm:block" onClick={logout}>Logout</Button>
                }
            </header>
            <ChatPage />
        </div >
    )
}
export default withAuth(Dashboard);