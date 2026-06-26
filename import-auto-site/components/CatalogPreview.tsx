import Image from "next/image";
import Link from "next/link";

export default function CatalogPreview() {
  return (
    <section id="catalog" className="py-20">
      <div className="mosaic-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-[#07152f] md:text-5xl">
              Каталог автомобилей
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              В каталоге будут актуальные лоты с аукционов Японии. Данные идут через наш Backend API,
              без прямого обращения Frontend к AJES.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Марка", "Модель", "Год", "Пробег", "Оценка", "Аукцион"].map((item) => (
                <span key={item} className="rounded-2xl bg-white px-5 py-3 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                  {item}
                </span>
              ))}
            </div>

            <Link
              href="/catalog"
              className="mt-8 inline-flex rounded-2xl bg-[#ff2d3d] px-8 py-4 font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#e51d2d]"
            >
              Открыть каталог →
            </Link>
          </div>

          <div className="mosaic-card overflow-hidden rounded-[2.5rem] p-4">
            <div className="relative h-[430px] overflow-hidden rounded-[2rem] bg-slate-100">
              <Image
                src="/mosaic/catalog-placeholder.png"
                alt="Каталог автомобилей"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
