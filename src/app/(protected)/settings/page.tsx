import AccountCard from "@/app/(protected)/settings/_components/account-card";
import EmailCard from "@/app/(protected)/settings/_components/email-card";
import PasswordCard from "@/app/(protected)/settings/_components/password-card";
import TutorProfileCard from "@/app/(protected)/settings/_components/tutor-profile-card";
import { SettingsNav } from "@/app/(protected)/settings/_components/settings-nav";

const SettingsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) => {
  const { section = "account" } = await searchParams;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and profile preferences.
        </p>
      </div>
      <div className="flex gap-10">
        <SettingsNav activeSection={section} />
        <div className="flex-1 min-w-0">
          {section === "account" && <AccountCard />}
          {section === "email" && <EmailCard />}
          {section === "password" && <PasswordCard />}
          {section === "tutor-profile" && <TutorProfileCard />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;