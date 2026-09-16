import { barrelImports } from "./barrel-imports.ts";
import { constantCase } from "./constant-case.ts";
import { functionReturnTypes } from "./function-return-types.ts";
import { iconProps } from "./icon-props.ts";
import { noComments } from "./no-comments.ts";
import { noUseClient } from "./no-use-client.ts";
import { queryKeys } from "./query-keys.ts";
import { reactNamedImports } from "./react-named-imports.ts";
import { stateNames } from "./state-names.ts";
import { storageAccess } from "./storage-access.ts";

export default {
  meta: { name: "house" },
  rules: {
    "barrel-imports": barrelImports,
    "constant-case": constantCase,
    "function-return-types": functionReturnTypes,
    "icon-props": iconProps,
    "no-comments": noComments,
    "no-use-client": noUseClient,
    "query-keys": queryKeys,
    "react-named-imports": reactNamedImports,
    "state-names": stateNames,
    "storage-access": storageAccess,
  },
};
