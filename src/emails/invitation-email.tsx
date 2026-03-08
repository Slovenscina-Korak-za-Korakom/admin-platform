import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  pixelBasedPreset,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const DAYS_OF_WEEK = {
  en:
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  ru: [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ]
}

interface InvitationEmailProps {
  tutorName: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  location: string;
  acceptUrl: string;
  declineUrl: string;
}

const getEmailTranslations = (locale: string) => {
  const translations = {
    en: {
      preview: "has invited you to a weekly tutoring session",
      heading: "Session Invitation",
      sub: "You've been invited to a recurring tutoring session",
      paragraph: "has invited you to a weekly tutoring session. Here are the details:",
      details: "Session Details",
      day: "Day",
      time: "Time",
      dayofWeek: "Every",
      duration: "Duration",
      location: "Location",
      accept: "Accept Invitation",
      decline: "Decline",
      disclaimer: "This invitation was sent by Slovenščina Korak za Korakom. If you did not expect this email, you can safely ignore it.",
      about: "About",
      pricing: "Pricing",
      contact: "Contact",
      copy: "Slovenščina Korak za Korakom. All Rights Reserved.",
    },
    ru: {
      preview: "приглашает вас на еженедельные занятия с репетитором.",
      heading: "Приглашение на урок",
      sub: "Вас пригласили на регулярное занятие с репетитором.",
      paragraph: "приглашает вас на еженедельные занятия с репетитором. Вот подробности:",
      details: "Подробности урока",
      day: "День",
      time: "Время",
      dayofWeek: "Каждый",
      duration: "Продолжительность",
      location: "Расположение",
      accept: "Принять приглашение",
      decline: "Отклонить",
      disclaimer: "Это приглашение было отправлено организацией Slovenščina Korak za Korakom. Если вы не ожидали этого письма, можете смело его проигнорировать.",
      about: "О нас",
      pricing: "Цены",
      contact: "Контакт",
      copy: "Словенщина Корак за Кораком. Все права защищены.",
    }
  }

  return translations[locale as keyof typeof translations] || translations.en;
}

export const InvitationEmail = ({
                                  tutorName,
                                  dayOfWeek,
                                  startTime,
                                  duration,
                                  location,
                                  acceptUrl,
                                  declineUrl,
                                }: InvitationEmailProps) => {
  const locale = "ru";
  const year = new Date().getFullYear();
  const dayName = DAYS_OF_WEEK[locale][dayOfWeek] ?? "Unknown";
  const durationText =
    duration >= 60
      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ""}`
      : `${duration} min`;

  const t = getEmailTranslations(locale);

  return (
    <Html>
      <Head/>
      <Tailwind config={{presets: [pixelBasedPreset]}}>
        <Preview>
          {`${tutorName} ${t.preview}`}
        </Preview>
        <Body
          className="bg-gray-50 font-sans text-base"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Main Container */}
          <Container
            className="mx-auto max-w-[600px]"
            style={{backgroundColor: "#F9FAFB"}}
          >
            {/* Top Spacer */}
            <Section style={{paddingTop: "40px"}}/>

            {/* Main Content Card */}
            <Container
              className="rounded-[20px] bg-white"
              style={{
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                margin: "0 auto",
                padding: "48px 40px",
              }}
            >
              {/* Header with Logo */}
              <Section style={{marginBottom: "32px"}}>
                <Row>
                  <Column align="center">
                    <Img
                      src="https://www.slovenscinakzk.com/logo-image.png"
                      alt="Slovenščina Korak za Korakom"
                      width={64}
                      height={64}
                      style={{borderRadius: "16px"}}
                    />
                  </Column>
                </Row>
                <Section className="text-center" style={{marginTop: "24px"}}>
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "#A855F7",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                      background:
                        "linear-gradient(135deg, #6089CB 0%, #A855F7 50%, #F9A8D4 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Slovenščina Korak za Korakom
                  </Text>
                  <Heading
                    as="h1"
                    style={{
                      fontSize: "32px",
                      lineHeight: "40px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 12px 0",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {t.heading}
                  </Heading>
                  <Text
                    style={{
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#6B7280",
                      margin: "0",
                    }}
                  >
                    {t.sub}
                  </Text>
                </Section>
              </Section>

              {/* Gradient Accent Line */}
              <Section
                style={{
                  height: "4px",
                  background:
                    "linear-gradient(90deg, #6089CB 0%, #A855F7 50%, #F9A8D4 100%)",
                  borderRadius: "2px",
                  marginBottom: "40px",
                }}
              />

              {/* Invitation Message */}
              <Section style={{marginBottom: "24px"}}>
                <Text
                  style={{
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#374151",
                    margin: "0",
                  }}
                >
                  <strong>{tutorName}</strong> {t.paragraph}
                </Text>
              </Section>

              {/* Session Details Card */}
              <Section
                style={{
                  backgroundColor: "#FAFAFA",
                  borderRadius: "16px",
                  padding: "32px",
                  marginBottom: "32px",
                  border: "2px solid #A855F7",
                }}
              >
                <Heading
                  as="h2"
                  style={{
                    fontSize: "18px",
                    lineHeight: "24px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: "0 0 24px 0",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {t.details}
                </Heading>

                {/* Details Grid */}
                <Section>
                  <Row style={{marginBottom: "16px"}}>
                    <Column style={{width: "40%"}}>
                      <Text
                        style={{
                          fontSize: "13px",
                          lineHeight: "20px",
                          color: "#6B7280",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {t.day}
                      </Text>
                    </Column>
                    <Column style={{width: "60%"}}>
                      <Text
                        style={{
                          fontSize: "15px",
                          lineHeight: "24px",
                          color: "#111827",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {`${t.dayofWeek} ${dayName}`}
                      </Text>
                    </Column>
                  </Row>

                  <Row style={{marginBottom: "16px"}}>
                    <Column style={{width: "40%"}}>
                      <Text
                        style={{
                          fontSize: "13px",
                          lineHeight: "20px",
                          color: "#6B7280",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {t.time}
                      </Text>
                    </Column>
                    <Column style={{width: "60%"}}>
                      <Text
                        style={{
                          fontSize: "15px",
                          lineHeight: "24px",
                          color: "#111827",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {startTime}
                      </Text>
                    </Column>
                  </Row>

                  <Row style={{marginBottom: "16px"}}>
                    <Column style={{width: "40%"}}>
                      <Text
                        style={{
                          fontSize: "13px",
                          lineHeight: "20px",
                          color: "#6B7280",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {t.duration}
                      </Text>
                    </Column>
                    <Column style={{width: "60%"}}>
                      <Text
                        style={{
                          fontSize: "15px",
                          lineHeight: "24px",
                          color: "#111827",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {durationText}
                      </Text>
                    </Column>
                  </Row>

                  <Row>
                    <Column style={{width: "40%"}}>
                      <Text
                        style={{
                          fontSize: "13px",
                          lineHeight: "20px",
                          color: "#6B7280",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {t.location}
                      </Text>
                    </Column>
                    <Column style={{width: "60%"}}>
                      <Text
                        style={{
                          fontSize: "15px",
                          lineHeight: "24px",
                          color: "#111827",
                          fontWeight: "500",
                          margin: "0",
                          textTransform: "capitalize",
                        }}
                      >
                        {location}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              </Section>

              {/* Action Buttons */}
              <Section style={{textAlign: "center", marginBottom: "32px"}}>
                <Button
                  href={acceptUrl}
                  style={{
                    display: "inline-block",
                    background:
                      "linear-gradient(135deg, #6089CB 0%, #A855F7 100%)",
                    color: "#ffffff",
                    padding: "14px 32px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "15px",
                    marginRight: "12px",
                  }}
                >
                  {t.accept}
                </Button>
                <Button
                  href={declineUrl}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    padding: "14px 32px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "15px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {t.decline}
                </Button>
              </Section>

              {/* Footer Note */}
              <Section
                style={{
                  textAlign: "center",
                  paddingTop: "24px",
                  borderTop: "1px solid #F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: "13px",
                    lineHeight: "20px",
                    color: "#9CA3AF",
                    margin: "0",
                  }}
                >
                  {t.disclaimer}
                </Text>
              </Section>
            </Container>

            {/* Footer */}
            <Section style={{padding: "40px 32px", textAlign: "center"}}>
              <Row>
                <Column align="center">
                  <table style={{margin: "0 auto"}}>
                    <tbody>
                    <tr>
                      <td style={{padding: "0 12px"}}>
                        <Link
                          href="https://www.slovenscinakzk.com/en/about-us"
                          style={{
                            color: "#6B7280",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {t.about}
                        </Link>
                      </td>
                      <td style={{padding: "0 12px"}}>
                        <Link
                          href="https://www.slovenscinakzk.com/en/pricing"
                          style={{
                            color: "#6B7280",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {t.pricing}
                        </Link>
                      </td>
                      <td style={{padding: "0 12px"}}>
                        <Link
                          href="mailto:support@slovenscinakzk.com"
                          style={{
                            color: "#6B7280",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                          target={"_self"}
                        >
                          {t.contact}
                        </Link>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </Column>
              </Row>
              <Text
                style={{
                  marginTop: "24px",
                  fontSize: "13px",
                  lineHeight: "20px",
                  color: "#9CA3AF",
                  marginBottom: "0",
                }}
              >
                &copy;{`${year} ${t.copy}`}
              </Text>
            </Section>

            {/* Bottom Spacer */}
            <Section style={{paddingBottom: "40px"}}/>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InvitationEmail;

InvitationEmail.PreviewProps = {
  tutorName: "Ana Novak",
  dayOfWeek: 2,
  startTime: "10:00",
  duration: 60,
  location: "online",
  acceptUrl: "https://example.com/accept",
  declineUrl: "https://example.com/decline",
} satisfies InvitationEmailProps;
