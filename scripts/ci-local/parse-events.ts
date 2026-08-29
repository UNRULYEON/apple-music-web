// Reads the `on:` block of a workflow. act cannot trigger workflow_call.
export function parseEvents(text: string): Array<string> {
  const header = /^on:(.*)$/m.exec(text);
  if (!header) {
    return [];
  }

  const inline = header[1].trim();
  let events: Array<string> = [];

  if (inline.startsWith("[")) {
    events = inline.slice(1, -1).split(",");
  } else if (inline) {
    events = [inline];
  } else {
    for (const line of text
      .slice(header.index + header[0].length)
      .split("\n")
      .slice(1)) {
      if (/^\S/.test(line)) {
        break;
      }
      const key = /^ {2}([\w-]+):/.exec(line);
      if (key) {
        events.push(key[1]);
      }
    }
  }

  return events.map((event) => event.trim()).filter((event) => event && event !== "workflow_call");
}
