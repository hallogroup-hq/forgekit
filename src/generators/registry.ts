import { GeneratorModule } from "./types";

// Import modules
import { meta as qrMeta } from "./modules/qr-code/meta";
import QrCodeGenerator from "./modules/qr-code/component";

import { meta as designMeta } from "./modules/design-md/meta";
import DesignMdGenerator from "./modules/design-md/component";

import { meta as characterMeta } from "./modules/character/meta";
import CharacterGenerator from "./modules/character/component";

import { meta as mockDataMeta } from "./modules/mock-data/meta";
import MockDataGenerator from "./modules/mock-data/component";

import { meta as cssGlassMeta } from "./modules/css-glass-shadow/meta";
import CssGlassShadowGenerator from "./modules/css-glass-shadow/component";

import { meta as passwordMeta } from "./modules/password-passphrase/meta";
import PasswordGenerator from "./modules/password-passphrase/component";

import { meta as uuidMeta } from "./modules/uuid-nanoid/meta";
import UuidNanoidGenerator from "./modules/uuid-nanoid/component";

import { meta as crontabMeta } from "./modules/crontab/meta";
import CrontabGenerator from "./modules/crontab/component";

import { meta as dockerMeta } from "./modules/docker-gitignore/meta";
import DockerGitignoreGenerator from "./modules/docker-gitignore/component";

import { meta as hashMeta } from "./modules/hash-secret/meta";
import HashSecretGenerator from "./modules/hash-secret/component";

import { meta as tableMeta } from "./modules/markdown-table/meta";
import MarkdownTableGenerator from "./modules/markdown-table/component";

import { meta as ogMeta } from "./modules/opengraph-preview/meta";
import OpenGraphPreviewGenerator from "./modules/opengraph-preview/component";

import { meta as invoiceMeta } from "./modules/invoice-receipt/meta";
import InvoiceReceiptGenerator from "./modules/invoice-receipt/component";

import { meta as agendaMeta } from "./modules/meeting-agenda/meta";
import MeetingAgendaGenerator from "./modules/meeting-agenda/component";

import { meta as emailSigMeta } from "./modules/email-signature/meta";
import EmailSignatureGenerator from "./modules/email-signature/component";

export const registry: GeneratorModule[] = [
  { meta: qrMeta, component: QrCodeGenerator },
  { meta: designMeta, component: DesignMdGenerator },
  { meta: characterMeta, component: CharacterGenerator },
  { meta: mockDataMeta, component: MockDataGenerator },
  { meta: cssGlassMeta, component: CssGlassShadowGenerator },
  { meta: passwordMeta, component: PasswordGenerator },
  { meta: uuidMeta, component: UuidNanoidGenerator },
  { meta: crontabMeta, component: CrontabGenerator },
  { meta: dockerMeta, component: DockerGitignoreGenerator },
  { meta: hashMeta, component: HashSecretGenerator },
  { meta: tableMeta, component: MarkdownTableGenerator },
  { meta: ogMeta, component: OpenGraphPreviewGenerator },
  { meta: invoiceMeta, component: InvoiceReceiptGenerator },
  { meta: agendaMeta, component: MeetingAgendaGenerator },
  { meta: emailSigMeta, component: EmailSignatureGenerator },
];

export const registryMap: Record<string, GeneratorModule> = registry.reduce(
  (acc, item) => {
    acc[item.meta.slug] = item;
    return acc;
  },
  {} as Record<string, GeneratorModule>
);

export function getGeneratorBySlug(slug: string): GeneratorModule | undefined {
  return registryMap[slug];
}
