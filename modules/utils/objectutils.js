export function typeOfDetailed(obj) 
{
	if (obj === null) return "null";
	const baseType = typeof obj;
	if (!["object", "function"].includes(baseType)) return '[PRIM] ' + baseType;
	if (baseType === "function" && Function.prototype.toString.call(obj).startsWith("class")) return "[FUNCTION CLASS] " + Function.prototype.toString.call(obj);
	const className = obj.constructor.name;
	if (typeof className === "string" && className !== "") return '[TYPE] ' + className;
	const tag = obj[Symbol.toStringTag];
	if (typeof tag === "string") return '[TAG] ' + tag;
	return baseType;
};