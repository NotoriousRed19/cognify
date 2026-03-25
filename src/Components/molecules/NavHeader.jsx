export default function NavHeader({className, wrapperClassName}) {
    return (
        <ul className={`flex gap-5 font-semibold ${wrapperClassName || ''}`}>
            <li><a href="#Hero" className={className}>Inicio</a></li>
            <li><a href="#Funciones" className={className}>Servicios</a></li>
            <li><a href="#Testimonios" className={className}>Testimonios</a></li>
            <li><a href="#Precios" className={className}>Precios</a></li>
        </ul>
    )
}
