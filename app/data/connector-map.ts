import ConfluenceIconSVG from "../../public/icons/connectors/confluence.svg";
import GmailIconSVG from "../../public/icons/connectors/gmail.svg";
import GoogleDriveIconSVG from "../../public/icons/connectors/google-drive.svg";
import JiraIconSVG from "../../public/icons/connectors/jira.svg";
import NotionIconSVG from "../../public/icons/connectors/notion.svg";
import OnedriveIconSVG from "../../public/icons/connectors/onedrive.svg";
import SalesforceIconSVG from "../../public/icons/connectors/salesforce.svg";
import SlackIconSVG from "../../public/icons/connectors/slack.svg";

export const CONNECTOR_MAP: Record<string, string[]> = {
  confluence: ["Confluence", ConfluenceIconSVG],
  jira: ["Jira", JiraIconSVG],
  gmail: ["Gmail", GmailIconSVG],
  google_drive: ["Google Drive", GoogleDriveIconSVG],
  notion: ["Notion", NotionIconSVG],
  onedrive: ["OneDrive", OnedriveIconSVG],
  salesforce: ["Salesforce", SalesforceIconSVG],
  slack: ["Slack", SlackIconSVG],
};

export default CONNECTOR_MAP;
