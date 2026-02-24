import {
	validate as uuidValidate,
	version as uuidVersion,
	v7 as uuidv7,
} from "uuid"

export function isUuidV7(value: string): boolean {
	const candidate = value.trim()
	return (
		candidate.length > 0 &&
		uuidValidate(candidate) &&
		uuidVersion(candidate) === 7
	)
}

export function createUuidV7(): string {
	return uuidv7()
}
