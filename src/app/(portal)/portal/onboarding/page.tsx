"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Zap, Bot, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    id: 1,
    icon: Zap,
    title: "Bienvenido a Reymen AI Ops",
    description: "Tu plataforma de automatizaciones con IA ya está lista. En los próximos pasos te mostraremos cómo sacar el máximo provecho.",
    cta: "Empezar",
  },
  {
    id: 2,
    icon: Bot,
    title: "Configura tu Asistente de WhatsApp",
    description: "El asistente AI atenderá a tus clientes 24/7, capturará leads y agendará citas automáticamente. Ve a WhatsApp AI para configurarlo.",
    cta: "Siguiente",
    action: "/portal/whatsapp",
    actionLabel: "Configurar ahora →",
  },
  {
    id: 3,
    icon: Users,
    title: "Invita a tu equipo",
    description: "Agrega a managers y agentes para que gestionen conversaciones, leads y citas desde la plataforma.",
    cta: "Siguiente",
    action: "/portal/settings",
    actionLabel: "Gestionar equipo →",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      router.push("/portal/dashboard");
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-brand-600" : i < step ? "w-2 bg-brand-300" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
            {current && <current.icon className="h-8 w-8 text-brand-600" />}
          </div>

          {/* Completed steps */}
          {step > 0 && (
            <div className="mb-4 flex items-center justify-center gap-1.5">
              {Array.from({ length: step }).map((_, i) => (
                <CheckCircle2 key={i} className="h-4 w-4 text-emerald-500" />
              ))}
              <span className="text-xs text-emerald-600 font-medium">{step} paso{step > 1 ? "s" : ""} completado{step > 1 ? "s" : ""}</span>
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 mb-3">{current?.title}</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">{current?.description}</p>

          <div className="space-y-3">
            {current?.action && (
              <a
                href={current.action}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
              >
                {current.actionLabel}
              </a>
            )}
            <Button onClick={handleNext} className="w-full" size="lg">
              {isLast ? (
                <>
                  Ir al dashboard
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                current?.cta
              )}
            </Button>
          </div>

          {!isLast && (
            <button
              onClick={() => router.push("/portal/dashboard")}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Saltar onboarding
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Reymen AI Ops · Soporte en cualquier momento desde Solicitudes
        </p>
      </div>
    </div>
  );
}
