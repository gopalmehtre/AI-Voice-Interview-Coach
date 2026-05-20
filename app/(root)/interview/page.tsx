import SetupForm from "@/components/SetupForm";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <div className="flex flex-col items-center w-full">
        <h3 className="text-3xl font-bold text-white mb-2 text-center">Interview Setup</h3>
        <p className="text-light-200/60 text-center">Customize your mock interview and upload your resume for tailored feedback.</p>
        
        <SetupForm userId={user?.id!} />
      </div>
    </>
  );
};

export default Page;
