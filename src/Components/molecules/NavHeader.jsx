import Link from "next/link";

export default function NavHeader({ className, wrapperClassName, onLinkClick }) {
  return (
    <ul className={`flex gap-5 font-semibold ${wrapperClassName || ""}`}>
      <li>
        <Link href="/#Hero" className={className} onClick={onLinkClick}>
          Inicio
        </Link>
      </li>
      <li>
        <Link href="/#Funciones" className={className} onClick={onLinkClick}>
          Servicios
        </Link>
      </li>
      <li>
        <Link href="/#Testimonios" className={className} onClick={onLinkClick}>
          Testimonios
        </Link>
      </li>
      <li>
        <Link href="/#Precios" className={className} onClick={onLinkClick}>
          Precios
        </Link>
      </li>
      <li>
        <Link href="/book" className={className} onClick={onLinkClick}>
          Reservar cita
        </Link>
      </li>
    </ul>
  );
}
