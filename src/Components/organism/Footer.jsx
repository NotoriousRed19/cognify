import { Brain } from "lucide-react";
import NavFooter from "@/Components/molecules/NavFooter";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="justify-center items-center py-8 bg-muted/50 border-t border-border/50">
      <div className="container lg:mx-60 sm:mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Brain className="w-5 h-5" color="white" />
            </div>
            <p className="text-brand-gradient font-bold text-lg cursor-pointer">
              Cognify
            </p>
          </Link>
          <NavFooter className="text-muted-foreground hover:text-primary duration-300 transition-colors" />
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2026 Cognify. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
