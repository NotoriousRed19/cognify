import Link from "next/link";

/**
 * NavFooter
 * 
 * @returns {JSX.Element} El componente renderizado.
 */
export default function NavFooter({ className, wrapperClassName }) {
  return (
    <ul className={`flex gap-5 font-semibold ${wrapperClassName || ""}`}>
      <li>
        <Link href="/privacy" className={className}>
          Privacidad
        </Link>
      </li>
      <li>
        <Link href="/terms" className={className}>
          Términos y condiciones
        </Link>
      </li>
      <li>
        <Link href="/contact" className={className}>
          Contacto
        </Link>
      </li>
    </ul>
  );
}
