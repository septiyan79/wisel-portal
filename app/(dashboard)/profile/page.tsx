import { auth } from "@/lib/auth"
import { ProfileTab } from "@/components/dashboard/ProfileTab"

export default async function ProfilePage() {
  const session = await auth()

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Profil Saya</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <ProfileTab
        customerAccount={session!.user.customerAccount}
        customerName={session!.user.customerName}
        role={session!.user.role}
      />
    </>
  )
}
