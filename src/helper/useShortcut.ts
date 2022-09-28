const MODIFIER_DELIM = '+';
const KEY_DELIM = '-';
const MODIFIER_SUFFIX = 'Key';

function trimLowerCase(string: string) {
  return string.trim().toLowerCase();
}

function parseModifiers(shortcutString: string) {
  const modifierString = shortcutString.split(KEY_DELIM)[0];
  const modifiers = modifierString.split(MODIFIER_DELIM);
  return modifiers.map(trimLowerCase);
}

function parseKey(shortcutString: string) {
  const key = shortcutString.split(KEY_DELIM)[1];
  return trimLowerCase(key);
}

function areModifiersPressed(event: KeyboardEvent, modifiers: string[]) {
  // @ts-ignore
  return modifiers.every((modifier) => event[modifier + MODIFIER_SUFFIX]);
}

function isKeyPressed(event: KeyboardEvent, key: string) {
  return event.key.toLowerCase() === key;
}

/**
 * shortcutString is in the form of: ctrl + ... + meta - key
 * @param event The keyboard event
 * @returns shortcut function which checks if a shortcut string is valid for the current event
 */
export function useShortcut(event: KeyboardEvent) {
  return function (shortcutString: string) {
    const modifiers = parseModifiers(shortcutString);
    const key = parseKey(shortcutString);
    return isKeyPressed(event, key) && areModifiersPressed(event, modifiers);
  };
}
