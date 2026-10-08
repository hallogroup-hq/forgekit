import { GeneratorModule } from "./types";

// Import existing modules
import { meta as qrMeta } from "./modules/qr-code/meta";
import QrCodeGenerator from "./modules/qr-code/component";

import { meta as designMeta } from "./modules/design-md/meta";
import DesignMdGenerator from "./modules/design-md/component";

import { meta as aiRulesMeta } from "./modules/ai-rules/meta";
import AiRulesGenerator from "./modules/ai-rules/component";

import { meta as appPrdMeta } from "./modules/app-prd/meta";
import AppPrdGenerator from "./modules/app-prd/component";

import { meta as webhookMeta } from "./modules/webhook-payload/meta";
import WebhookPayloadGenerator from "./modules/webhook-payload/component";

import { meta as sqlSchemaMeta } from "./modules/sql-schema/meta";
import SqlSchemaGenerator from "./modules/sql-schema/component";

import { meta as meshGradientMeta } from "./modules/mesh-gradient/meta";
import MeshGradientGenerator from "./modules/mesh-gradient/component";

import { meta as colorContrastMeta } from "./modules/color-contrast/meta";
import ColorContrastGenerator from "./modules/color-contrast/component";

import { meta as utmMeta } from "./modules/utm-builder/meta";
import UtmBuilderGenerator from "./modules/utm-builder/component";

import { meta as copywritingMeta } from "./modules/copywriting-framework/meta";
import CopywritingFrameworkGenerator from "./modules/copywriting-framework/component";

import { meta as readmeBadgeMeta } from "./modules/readme-badge/meta";
import ReadmeBadgeGenerator from "./modules/readme-badge/component";

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

import { meta as promptOptMeta } from "./modules/prompt-optimizer/meta";
import PromptOptimizerGenerator from "./modules/prompt-optimizer/component";

import { meta as regexCheatMeta } from "./modules/regex-cheat/meta";
import RegexCheatGenerator from "./modules/regex-cheat/component";

import { meta as curlConvMeta } from "./modules/curl-converter/meta";
import CurlConverterGenerator from "./modules/curl-converter/component";

import { meta as jwtInspectMeta } from "./modules/jwt-inspector/meta";
import JwtInspectorGenerator from "./modules/jwt-inspector/component";

import { meta as svgBlobMeta } from "./modules/svg-blob/meta";
import SvgBlobGenerator from "./modules/svg-blob/component";

import { meta as aspectRatioMeta } from "./modules/aspect-ratio/meta";
import AspectRatioGenerator from "./modules/aspect-ratio/component";

import { meta as socialBioMeta } from "./modules/social-bio/meta";
import SocialBioGenerator from "./modules/social-bio/component";

import { meta as textCleanerMeta } from "./modules/text-cleaner/meta";
import TextCleanerGenerator from "./modules/text-cleaner/component";

import { meta as whatsappMeta } from "./modules/whatsapp-link/meta";
import WhatsappLinkGenerator from "./modules/whatsapp-link/component";

import { meta as campaignQaMeta } from "./modules/campaign-url-qa/meta";
import CampaignUrlQaGenerator from "./modules/campaign-url-qa/component";

export const registry: GeneratorModule[] = [
  // Flagship Workstation Modules
  { meta: qrMeta, component: QrCodeGenerator },
  { meta: textCleanerMeta, component: TextCleanerGenerator },
  { meta: whatsappMeta, component: WhatsappLinkGenerator },
  { meta: campaignQaMeta, component: CampaignUrlQaGenerator },
  { meta: designMeta, component: DesignMdGenerator },
  { meta: promptOptMeta, component: PromptOptimizerGenerator },
  { meta: aiRulesMeta, component: AiRulesGenerator },
  { meta: webhookMeta, component: WebhookPayloadGenerator },
  { meta: appPrdMeta, component: AppPrdGenerator },
  { meta: curlConvMeta, component: CurlConverterGenerator },
  { meta: regexCheatMeta, component: RegexCheatGenerator },
  { meta: jwtInspectMeta, component: JwtInspectorGenerator },
  { meta: sqlSchemaMeta, component: SqlSchemaGenerator },
  { meta: meshGradientMeta, component: MeshGradientGenerator },
  { meta: svgBlobMeta, component: SvgBlobGenerator },
  { meta: aspectRatioMeta, component: AspectRatioGenerator },
  { meta: colorContrastMeta, component: ColorContrastGenerator },
  { meta: utmMeta, component: UtmBuilderGenerator },
  { meta: socialBioMeta, component: SocialBioGenerator },
  { meta: copywritingMeta, component: CopywritingFrameworkGenerator },
  { meta: readmeBadgeMeta, component: ReadmeBadgeGenerator },
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
