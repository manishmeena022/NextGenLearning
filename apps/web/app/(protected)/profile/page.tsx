import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileInfo from "@/components/profile/ProfileInfo";
import EditProfileForm from "@/components/profile/EditProfileForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import ActiveSessions from "@/components/profile/ActiveSessions";

export default function ProfilePage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>
                <TabsContent value="info">
                    <ProfileInfo />
                </TabsContent>
                <TabsContent value="edit">
                    <EditProfileForm />
                </TabsContent>
                <TabsContent value="password">
                    <ChangePasswordForm />
                </TabsContent>
                <TabsContent value="sessions">
                    <ActiveSessions />
                </TabsContent>
            </Tabs>
        </div>
    );
}
