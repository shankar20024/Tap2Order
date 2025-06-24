import Image from "next/image";
import NavButton from "./components/NavButton";

export const metadata = {
  title: 'Tap2Order - Welcome',
  description: 'Welcome to Tap2Order - Your digital menu and ordering solution',
};

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <NavButton href="/login" label="Login"/>
    </div>
  );
}
