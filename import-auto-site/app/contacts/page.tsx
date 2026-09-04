import type { Metadata } from "next";
import PublicInfoShell, { InfoCard } from "@/components/PublicInfoShell";
import SeoJsonLd from "@/components/SeoJsonLd";
import {
  breadcrumbJsonLd,
  MANAGER_PHONE,
  MANAGER_PHONE_E164,
  MAX_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты MosaicAuto: телефон менеджера и MAX для вопросов по автомобилям из Японии и Китая, подбору и покупке.",
  alternates: { canonical: "/contacts" },
  openGraph: {
    url: "/contacts",
    title: "Контакты MosaicAuto",
    description: "Связаться с менеджером MosaicAuto по телефону или в MAX.",
  },
};

export default function ContactsPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Контакты", path: "/contacts" },
        ])}
      />
      <PublicInfoShell
        eyebrow="Контакты"
        title="Связаться с MosaicAuto"
        intro="Для вопросов по конкретному автомобилю, подбору или следующему этапу покупки используйте телефон менеджера или MAX."
        contact={false}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard title="Телефон">
            <p>Позвоните менеджеру и сообщите, какой автомобиль рассматриваете. Для лота удобнее сразу назвать номер или открыть его страницу на сайте.</p>
            <a
              href={`tel:${MANAGER_PHONE_E164}`}
              className="mt-5 inline-flex rounded-xl bg-[#ff2d3d] px-5 py-4 text-base font-black text-white transition hover:bg-[#07152f]"
            >
              {MANAGER_PHONE}
            </a>
          </InfoCard>

          <InfoCard title="MAX">
            <p>В сообщении можно отправить ссылку на автомобиль и сразу добавить вопросы по комплектации, расчёту или доставке.</p>
            <a
              href={MAX_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-xl bg-[#07152f] px-5 py-4 text-base font-black text-white transition hover:bg-[#ff2d3d]"
            >
              Написать в MAX →
            </a>
          </InfoCard>
        </div>

        <InfoCard title="Что лучше подготовить перед обращением">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Ссылку на автомобиль или номер лота", "Желаемую марку и модель", "Ориентир по бюджету", "Город, куда нужна доставка"].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f7f9fc] p-4 font-bold text-[#07152f] ring-1 ring-slate-100">
                {item}
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="По какому вопросу можно обратиться">
          <p>
            По конкретному лоту, самостоятельному подбору, ориентировочному расчёту стоимости, этапам покупки и доставке автомобиля в выбранный город.
          </p>
        </InfoCard>
      </PublicInfoShell>
    </>
  );
}
