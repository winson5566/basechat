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
              src={new URL("/images/title-logo.svg", settings.BASE_URL).toString()}
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
            <Link href="https://www.winsonwu.com" className="underline text-[#74747A]">
              WinsonWu
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
        <Text className="text-[#1D1D1F] text-lg mb-8">Hi{name ? ` ${name}` : ""},</Text>
        <Text className="text-[#1D1D1F] text-lg">
          A request was made to change your {settings.APP_NAME} account password. If this was you, you can set a new
          password here:
        </Text>

        <Button
          href={link}
          className="w-full text-center my-8 rounded-[54px] bg-[#D946EF] py-2.5 text-white font-semibold"
        >
          Reset password
        </Button>

        <Text className="text-[#1D1D1F] text-lg">
          If you don&apos;t want to reset your password or didn&apos;t request this, just ignore and delete this
          message.
        </Text>
      </Section>
    </Layout>
  );
};

export const InviteHtml = ({
  name,
  link,
  tenantName,
}: {
  name: string | null;
  link: string;
  tenantName: string | null;
}) => {
  return (
    <Layout preview={`You have been invite to join ${settings.APP_NAME}`}>
      <Section>
        <Text className="text-[#1D1D1F] text-2xl mb-8 font-bold">
          {name ? `${name} has invited you` : "You have been invited"} to join{" "}
          {tenantName ? `"${tenantName}" chatbot` : settings.APP_NAME}!
        </Text>
        <Text className="text-[#1D1D1F] text-lg">Accept your invitation to start your chat experience.</Text>

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
        <Text className="text-[#1D1D1F] text- mb-8 font-bold">You&apos;ve reached your page processing limit</Text>
        <Text className="text-[#1D1D1F] text-lg mb-6">
          You&apos;ve reached the page limit for your current plan
          {tenantName ? ` on the chatbot "${tenantName}."` : "."}
        </Text>
        <Text className="text-[#1D1D1F] text-lg mb-8">
          Upgrade your plan to get immediate access to more pages and keep the conversation going.
        </Text>

        <Button
          href={link}
          className="w-full text-center my-8 rounded-[54px] bg-[#D946EF] py-2.5 text-white font-semibold"
        >
          Upgrade Plan
        </Button>

        <Text className="text-[#1D1D1F] text-lg">
          Have questions about your usage or plan?{" "}
          <a href="mailto:awinsonwu@gmail.com" className="underline text-[#D946EF]">
            Contact us
          </a>
        </Text>
      </Section>
    </Layout>
  );
};

export const VerifyEmailHtml = ({ name, link }: { name: string | null; link: string }) => {
  return (
    <Layout preview={`Verify your ${settings.APP_NAME} email address`}>
      <Section>
        <Text className="text-[#1D1D1F] text-lg mb-8">Hi{name ? ` ${name}` : ""},</Text>
        <Text className="text-[#1D1D1F] text-lg">
          Welcome to {settings.APP_NAME}! Please verify your email address by clicking the button below:
        </Text>

        <Button
          href={link}
          className="w-full text-center my-8 rounded-[54px] bg-[#D946EF] py-2.5 text-white font-semibold"
        >
          Verify Email
        </Button>

        <Text className="text-[#1D1D1F] text-lg">
          If you didn&apos;t create an account with {settings.APP_NAME}, you can safely ignore this email.
        </Text>
      </Section>
    </Layout>
  );
};
