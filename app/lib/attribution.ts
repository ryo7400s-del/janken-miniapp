const BUILDER_CODE = "bc_upyavpsc";
const ERC8021_MARKER = "80218021802180218021802180218021";

export function addERC8021Attribution(existingData?: string): string {
  const codeHex = Array.from(new TextEncoder().encode(BUILDER_CODE))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  const codeLen = (BUILDER_CODE.length).toString(16).padStart(4, "0");
  const header = "0007";
  const suffix = header + codeLen + codeHex + ERC8021_MARKER;
  if (!existingData || existingData === "0x") {
    return "0x" + suffix;
  }
  const base = existingData.startsWith("0x") ? existingData.slice(2) : existingData;
  return "0x" + base + suffix;
}
