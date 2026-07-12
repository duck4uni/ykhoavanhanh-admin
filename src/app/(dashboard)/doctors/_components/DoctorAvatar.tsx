import Image from "next/image";
import { UserRound } from "lucide-react";
import type { HisDoctor } from "@/api/doctorsApi";
import { getImageSrc } from "../list-helpers";

export function DoctorAvatar({ doctor }: { doctor: HisDoctor }) {
  const src = getImageSrc(doctor.avatar_url);
  if (src) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100">
        <Image src={src} alt={doctor.doctorname} fill sizes="40px" className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
      <UserRound className="h-5 w-5" />
    </div>
  );
}
