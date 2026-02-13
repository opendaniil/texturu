import { z } from "zod"

export const stringToDateCodec = z.codec(z.iso.datetime(), z.date(), {
	decode: (iso) => new Date(iso),
	encode: (d) => d.toISOString(),
})
