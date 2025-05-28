import { redirect } from "next/navigation";

export default function Home() {
  redirect("/customer/quote-generator");
  return null;
}
