import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Heading,
  Button,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

import * as settings from "@/lib/server/settings";

const Layout = ({ children, preview }: { children: React.ReactElement; preview: string }) => (
  <Html>
    <Head>
      <Preview>{preview}</Preview>
    </Head>
    <Tailwind>
      <Body className="m-0 p-0 bg-gray-100 font-sans">
        <Section className="text-center" style={{ paddingTop: "36px" }}>
          <div className="flex justify-center items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={new URL("/images/title-logo.png", settings.BASE_URL).toString()}
              alt={settings.APP_NAME}
              style={{
                width: "220px",
                height: "32px",
                maxWidth: "100%",
                display: "block",
                margin: "0 auto",
                border: "0",
                outline: "none",
                textDecoration: "none",
                textAlign: "center",
                verticalAlign: "middle",
              }}
            />
          </div>
        </Section>

        <Container className="mx-auto mt-10 w-[504px] p-12 bg-white rounded-[24px]">{children}</Container>

        <Section className="text-center mt-8">
          <Text className="text-[#74747A] text-[14px]">
            {settings.APP_NAME} is powered by&nbsp;
            <Link href="https://www.ragie.ai/?utm_source=basechat-email" className="underline text-[#74747A]">
              Ragie
            </Link>
          </Text>
        </Section>
      </Body>
    </Tailwind>
  </Html>
);

export const ResetPasswordHtml = ({ name, link }: { name: string | null; link: string }) => {
  return (
    <Layout preview={`Reset your ${settings.APP_NAME} password`}>
      <Section>
        <Text className="text-[#1D1D1F] text-[18px] mb-8">Hi{name ? ` ${name}` : ""},</Text>
        <Text className="text-[#1D1D1F] text-[18px]">
          A request was made to change your {settings.APP_NAME} account password. If this was you, you can set a new
          password here:
        </Text>

        <Button
          href={link}
          className="w-full text-center my-8 rounded-[54px] bg-[#D946EF] py-2.5 text-white font-semibold"
        >
          Reset password
        </Button>

        <Text className="text-[#1D1D1F] text-[18px]">
          If you don&apos;t want to reset your password or didn&apos;t request this, just ignore and delete this
          message.
        </Text>
      </Section>
    </Layout>
  );
};

export const InviteHtml = ({ name, link }: { name: string | null; link: string }) => {
  return (
    <Layout preview={`You have been invite to join ${settings.APP_NAME}`}>
      <Section>
        <Text className="text-[#1D1D1F] text-[24px] mb-8 font-bold">
          {name ? `${name} has` : "You have been"} invited to join {settings.APP_NAME}!
        </Text>
        <Text className="text-[#1D1D1F] text-[18px]">Accept your invitation to start your chat experience.</Text>

        <Button
          href={link}
          className="w-full text-center mt-8 rounded-[54px] bg-[#D946EF] py-2.5 text-white font-semibold"
        >
          Accept invite
        </Button>
      </Section>
    </Layout>
  );
};

export const PagesLimitReachedHtml = ({ tenantName, link }: { tenantName: string | null; link: string }) => {
  return (
    <Layout preview={`You have reached your ${settings.APP_NAME} page processing limit`}>
      <Section>
        <Text className="text-[#1D1D1F] text-[24px] mb-8 font-bold">
          You&apos;ve reached your page processing limit
        </Text>
        <Text className="text-[#1D1D1F] text-[18px] mb-6">
          You&apos;ve reached the page limit for your current plan
          {tenantName ? ` on the chatbot "${tenantName}."` : "."}
        </Text>
        <Text className="text-[#1D1D1F] text-[18px] mb-8">
          Upgrade your plan to get immediate access to more pages and keep the conversation going.
        </Text>

        <Button
          href={link}
          className="w-full text-center my-8 rounded-[54px] bg-[#D946EF] py-2.5 text-white font-semibold"
        >
          Upgrade Plan
        </Button>

        <Text className="text-[#1D1D1F] text-[18px]">
          Have questions about your usage or plan?{" "}
          <a href="mailto:sales@ragie.ai" className="underline text-[#D946EF]">
            Contact us
          </a>
        </Text>
      </Section>
    </Layout>
  );
};
