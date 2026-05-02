"use client";

import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Markets from "../components/Markets";
import AuthBlock from "../components/AuthBlock";
import Catalog from "../components/Catalog";
import Steps from "../components/Steps";
import CalcBlock from "../components/CalcBlock";
import Contacts from "../components/Contacts";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Hero />
      <Markets />
      <AuthBlock setIsLoggedIn={setIsLoggedIn} />
      <Catalog isLoggedIn={isLoggedIn} />
      <Steps />
      <CalcBlock />
      <Contacts />
    </>
  );
}