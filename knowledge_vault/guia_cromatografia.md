# Guía de Análisis de Cromatografías de Pfeiffer (Ground Truth)

Esta es la bóveda de conocimiento principal para la interpretación de Cromatografías de Pfeiffer en Biota Protocol.
**INSTRUCCIÓN ESTRICTA PARA LA IA:** Usa estos criterios para determinar la salud del suelo y emitir un Veredicto Biológico (`bioScore`).

## 1. Estructura Física del Cromatograma (Zonas)

1.  **Zona Central (Ombligo):** Zona formada por el paso de las soluciones a través de la columna de papel y el oriﬁcio central. Indica el contenido de oxígeno en las sustancias. Una zona clara denota buena oxigenación.
2.  **Zona Interna (Mineral):** En esta zona, los diferentes compuestos orgánicos quedan unidos a arcillas y alófanos, dando una textura grumosa formando una red de canalillos que asemejan la estructura de una pluma.
3.  **Zona Media (Orgánica):** Se depositan complejos orgánicos sin vinculación con materia mineral, menos densos y más fácilmente transmisibles. Posee textura grumosa. Indica procesos de transformación de las sustancias.
4.  **Zona Externa (Húmica / Enzimática):** Existen agregados más livianos, componentes del humus (en forma de manchas o lunares). Las formas de plumas llegan hasta el ﬁnal de la zona. Indica nitrógeno enlazado y formas estables de coloides de humus.

## 2. Metodología de Análisis Cualitativo

A todas aquellas ﬁguras que se forman en el cromatograma por el paso de la solución:

*   **Estrías Radiales:** Originadas por el desplazamiento de la solución. Un buen suelo presentará radiación con estrías laterales interconectadas, de límites difusos y ejes anchos (indicador de actividad enzimática y/o biológica). Recorren todo el cromatograma indicando excelente intercambio orgánico mineral.
*   **Radiación:** Estructura radial, lineal y central de la que se expanden corrientes hacia la periferia. Su ausencia indica carencia de agregados.
*   **Rupturas y Picos:** Se encuentran en el área externa. Son indicadores de materia viva y sustancias básicas esenciales. La ruptura de los picos muestra diversos componentes del humus.
*   **Manchas:** Aparecen en la zona húmica. Coloración ocre, café oscuro, rojizo (esperado para suelo bueno). Indicador de proteínas y nitrógeno orgánico.
*   **Integración de Zonas:** Una buena integración muestra límites difuminados (difícil discriminación). Signiﬁca que la materia orgánica y los minerales están bien integrados. Límites marcados o bandas (no integrados) indican suelos deﬁcientes, presencia de sales o bloqueos químicos.

## 3. Coloración de los Cromatogramas

La reacción produce coloraciones que determinan el estado de salud:

*   **Excelente (Amarillo, dorado, naranja, rojizo o café claro y tonalidades de verde):** Buena estructura física, saludable, buena carga biológica y gran capacidad de intercambio gaseoso. (Puntuación alta).
*   **Medianamente Bueno (Combinación de café claro y muy oscuro):** Suelo con algunas limitantes, presencia de materia orgánica con poca oxidación, biota alterada, posible compactación superﬁcial.
*   **Deﬁciente (Negro, ceniza, pardo oscuro, lila, violeta, gris o escala de azules):** Suelo deﬁciente con presencia de bloqueos, sales y/o residualidad química, compactación y pérdida/disminución de intercambio gaseoso.

## 4. Indicadores de Toxicidad y Uso de Agroquímicos

*   **Residualidad Química (Herbicidas/Pesticidas):** Se reﬂeja en la alteración de estructuras y pérdida de intercambio. Aumento de patógenos y reducción de benéﬁcos. Condición de desequilibrio inducido. 
*   **Identificación Visual de Toxicidad:** Disminución drástica de los picos de la zona externa, bandas marcadas y coloraciones anormales (grises, lilas, asimétricas).
*   **Pérdida de Simetría (Análisis Armónico):** La pérdida de una estructura armónica o simétrica de los 4 hemisferios permite inferir la presencia de déﬁcit estructurales y toxicidad.

## 5. Puntuación y Veredicto (Calidad de Suelo - CS)

Para emitir el `bioScore` o valorización final, evalúa de 0 a 5 (donde 0 es sin capacidad productiva y 5 es viable para producción orgánica excelente):

*   **Actividad Biológica:** ¿Hay picos, manchas, y radiación difusa?
*   **Sustancias Orgánicas Esenciales:** ¿La zona externa es rica y dentada?
*   **Porcentaje de Humiﬁcación & Relación Orgánico-Mineral:** ¿Están las zonas perfectamente integradas y difuminadas entre sí?
*   **Estado de Agregación del Suelo:** ¿Hay buena radiación desde el centro hasta la periferia?
*   **Determinación de Toxicidad:** ¿Hay asimetría, anillos bloqueados o colores violetas/grises oscuros?

**Fórmula de Veredicto de la IA:** Si la imagen tiene buena integración, color dorado/ocre y picos marcados, aprueba el `execute_double_trigger` con un `bioScore` de 4 o 5. Si presenta colores oscuros (gris/negro/violeta), bandas rígidas, asimetría, o no hay picos externos, detén el pago y emite una advertencia de toxicidad o compactación severa (`bioScore` < 2).

*(Fuente: Documentación Interna Biota Protocol - Extraído de Manual de Cromatografía).*
