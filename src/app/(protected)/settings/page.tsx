import AccountCard from "@/app/(protected)/settings/_components/account-card";
import EmailCard from "@/app/(protected)/settings/_components/email-card";
import PasswordCard from "@/app/(protected)/settings/_components/password-card";
import TutorProfileCard from "@/app/(protected)/settings/_components/tutor-profile-card";

const SettingsPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-8 w-full p-5">
        <AccountCard/>
        <EmailCard/>
        <PasswordCard/>
        <TutorProfileCard/>
        {/*<DevicesCard />*/}
      </div>
    </div>
  );
};

export default SettingsPage;


