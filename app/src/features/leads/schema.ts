import { z } from 'zod';

/** Datos que manda el formulario. Se validan de nuevo en el servidor: el cliente no es confiable. */
export const leadInputSchema = z.object({
  projectSlug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  unitId: z.string().max(64).nullable(),
  name: z.string().trim().min(2, 'Escribí tu nombre').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, 'Escribí un teléfono válido, con característica'),
  email: z.union([z.literal(''), z.email('Escribí un email válido').max(120)]).transform((v) => v || null),
  message: z.string().trim().max(600).transform((v) => v || null),
  /** Campo trampa: invisible para personas; si viene con texto, es un bot. */
  website: z.string().max(200).optional(),
});

export type LeadInput = z.input<typeof leadInputSchema>;
export type LeadData = z.output<typeof leadInputSchema>;
