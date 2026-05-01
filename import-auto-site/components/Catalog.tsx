"use client";

import { cars } from "../data/cars";

export default function Catalog() {
  return (
    <section className="p-10">
      <h2 className="text-3xl font-bold mb-6">Каталог</h2>

      <div className="grid grid-cols-2 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="border p-4 rounded-2xl">
            <h3 className="text-xl font-bold">
              {car.brand} {car.model}
            </h3>
            <p>{car.country}</p>
            <p className="text-red-600 font-bold">
              {car.price.toLocaleString()} ₽
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}