import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "@tanstack/react-router";

export function BackButton() {
  const { history } = useRouter();

  return (
    <Button
      className="bg-white border border-gray-100 text-gray-800 font-semibold px-4 py-1.5 rounded-sm text-sm hover:bg-gray-100"
      onClick={() => history.go(-1)}
    >
      <ArrowLeft />
      <span className="ml-2">Back</span>
    </Button>
  );
}