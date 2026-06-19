import Image from "next/image";
import Link from "next/link";

export default function AppLogo({
  href = "/dashboard",
  className = "",
  imageClassName = "h-10 w-auto",
}) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Company Logo"
        width={160}
        height={48}
        priority
        className={imageClassName}
      />
    </Link>
  );
}