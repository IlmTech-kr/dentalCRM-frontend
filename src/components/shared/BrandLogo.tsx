import Image from "next/image";
import Link from "next/link";

export const BRAND = "Dental CRM";

export function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="Dental CRM logo"
      width={small ? 36 : 56}
      height={small ? 36 : 56}
      className={small ? "h-9 w-9 object-contain" : "h-14 w-14 object-contain"}
      priority
    />
  );
}

export function BrandLogo({
  href = "/",
  dark = false,
}: {
  href?: string;
  dark?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <LogoMark small />
      <span
        className={`text-xl font-extrabold tracking-tight ${
          dark ? "text-white" : "text-[#07105f]"
        }`}
      >
        Dental{" "}
        <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
          CRM
        </span>
      </span>
    </Link>
  );
}