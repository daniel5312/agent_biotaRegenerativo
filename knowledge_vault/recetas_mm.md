# Guía Oficial de Biopreparados Biota (Ground Truth)

Esta es la bóveda de conocimiento principal para la validación de recetas de Agricultura Regenerativa, específicamente para los Microorganismos de Montaña (MM).
**INSTRUCCIÓN ESTRICTA PARA LA IA:** Utiliza estas métricas y proporciones exactas para evaluar si las preparaciones del campesino son correctas y seguras.

## 1. Microorganismos de Montaña (MM) Sólidos

El objetivo es capturar y reproducir la microbiología nativa del bosque.

**Ingredientes Estándar (Proporción para 1 caneca de 200 Litros):**
*   **Hojarasca de bosque nativo:** 3 sacos (aprox. 40-50 kg). Debe oler a hongo fresco, no a pudrición.
*   **Salvado (de arroz, trigo o maíz):** 1 saco (aprox. 40 kg). Aporta carbohidratos complejos.
*   **Melaza (o panela diluida):** 1 galón (aprox. 4-5 litros). Aporta energía rápida.
*   **Agua sin cloro:** Cantidad necesaria para alcanzar la "Prueba del Puño" (aprox. 10 a 20 litros).

**Proceso de Evaluación:**
1.  **Mezclado:** Debe hacerse sobre plástico limpio o piso de cemento.
2.  **Humedad (Prueba del Puño):** Al apretar la mezcla en el puño, NO debe gotear agua, y al abrir la mano, la masa debe mantener la forma sin desmoronarse (Humedad entre 30% y 40%).
3.  **Empacado:** Se debe apisonar muy bien en la caneca para expulsar todo el aire (proceso Anaeróbico).
4.  **Fermentación:** Debe reposar cerrado herméticamente por **30 días**. Olor final a fermento dulce (chicha/levadura). Si huele a podrido, la mezcla se dañó.

## 2. Microorganismos de Montaña (MM) Líquidos (Activación)

A partir del MM Sólido, se activa en agua para su aplicación foliar o drench (al suelo).

**Ingredientes (Proporción para 200 Litros):**
*   **MM Sólido maduro:** 5 a 10 kg (envuelto en una malla o costal poroso, como si fuera una bolsa de té).
*   **Melaza:** 1 galón (aprox. 4 litros).
*   **Agua sin cloro:** 180 litros.

**Proceso de Evaluación:**
1.  **Fermentación:** Proceso aeróbico o anaeróbico (preferible anaeróbico con trampa de aire/manguera).
2.  **Tiempo:** 4 a 8 días de fermentación.
3.  **Veredicto:** Si el campesino indica que lo activó por más de 15 días, advierte que los microorganismos empiezan a morir por falta de alimento. Olor debe ser a fermento, nunca a putrefacción.

## 3. Criterios de Evaluación y Veredicto (`bioScore`)

El `ANALISTA_LAB` debe evaluar los reportes del agricultor.

*   **Puntuación Excelente (4 o 5):** El agricultor respeta los ingredientes básicos (fuente de inóculo, fuente de carbohidrato, fuente de energía pura) y menciona tiempos correctos (30 días sólido, 4-8 días líquido) y la prueba del puño. Aprobar `validate_soil_action`.
*   **Puntuación Regular (2 o 3):** Falta algún ingrediente menor o los tiempos son ligeramente imprecisos.
*   **Puntuación Deficiente (0 o 1):** Usa agua con cloro de grifo directamente, no usa melaza/panela, o su mezcla huele a podrido. Denegar acción y recomendar desechar la mezcla.

*(Basado en Agricultura Orgánica Regenerativa - Jairo Restrepo y Manuales de Campo).*
