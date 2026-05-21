import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

import { getCurrentUser } from "@/lib/actions/auth.action";
import SignOutButton from "@/components/SignOutButton";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  return (
    <div className="root-layout">
      <nav>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Prepsync AI Logo" width={38} height={32} />
          <h2 className="text-primary-100">Prepsync AI</h2>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <p className="text-primary-100 text-sm max-sm:hidden">
                {user.name}
              </p>
              <SignOutButton />
            </>
          )}
        </div>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
