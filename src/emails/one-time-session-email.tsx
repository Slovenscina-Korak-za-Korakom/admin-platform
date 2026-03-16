import {
  Body,
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

interface OneTimeSessionEmailProps {
  tutorName: string;
  studentName: string;
  date: string;        // pre-formatted, e.g. "Monday, 16 March 2026"
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  duration: number;    // minutes
  sessionType: "individual" | "group" | "test";
  location: "online" | "classroom";
  recipientType: "student" | "tutor";
  locale?: "en" | "ru";
}

const getTranslations = (locale: "en" | "ru") => {
  const map = {
    en: {
      heading: "Session Confirmed",
      details: "Session Details",
      date: "Date",
      time: "Time",
      duration: "Duration",
      type: "Session type",
      location: "Location",
      withStudent: "Tutor",
      withTutor: "Student",
      individual: "Individual",
      group: "Group",
      test: "Test",
      online: "Online",
      classroom: "Classroom",
      disclaimer:
        "This confirmation was sent by Slovenščina Korak za Korakom. If you have questions, please contact your tutor directly.",
      about: "About",
      pricing: "Pricing",
      contact: "Contact",
      copy: "Slovenščina Korak za Korakom. All Rights Reserved.",
    },
    ru: {
      heading: "Занятие подтверждено",
      details: "Детали занятия",
      date: "Дата",
      time: "Время",
      duration: "Продолжительность",
      type: "Тип занятия",
      location: "Формат",
      withStudent: "Преподаватель",
      withTutor: "Ученик",
      individual: "Индивидуальное",
      group: "Групповое",
      test: "Пробное",
      online: "Онлайн",
      classroom: "В классе",
      disclaimer:
        "Это подтверждение отправлено организацией Slovenščina Korak za Korakom. По вопросам обращайтесь к преподавателю.",
      about: "О нас",
      pricing: "Цены",
      contact: "Контакт",
      copy: "Словенщина Корак за Кораком. Все права защищены.",
    },
  };
  return map[locale];
};

export const OneTimeSessionEmail = ({
  tutorName,
  studentName,
  date,
  startTime,
  endTime,
  duration,
  sessionType,
  location,
  recipientType,
  locale = "en",
}: OneTimeSessionEmailProps) => {
  const t = getTranslations(locale);
  const year = new Date().getFullYear();

  const durationText =
    duration >= 60
      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ""}`
      : `${duration} min`;

  const sessionTypeLabel = t[sessionType];
  const locationLabel = location === "online" ? t.online : t.classroom;
  const withLabel = recipientType === "student" ? t.withStudent : t.withTutor;
  const withName = recipientType === "student" ? tutorName : studentName;

  const previewText =
    recipientType === "student"
      ? locale === "en"
        ? `Your session with ${tutorName} on ${date} is confirmed`
        : `Ваше занятие с ${tutorName} подтверждено`
      : locale === "en"
      ? `Session with ${studentName} on ${date} booked`
      : `Занятие с ${studentName} забронировано`;

  const messageText =
    recipientType === "student"
      ? locale === "en"
        ? `${tutorName} has booked a session with you. Here are the details:`
        : `${tutorName} записал вам занятие. Вот подробности:`
      : locale === "en"
      ? `You have successfully booked a session with ${studentName}. Here are the details:`
      : `Вы успешно записали занятие с ${studentName}. Вот подробности:`;

  const rows = [
    { label: t.date, value: date },
    { label: t.time, value: `${startTime} – ${endTime}` },
    { label: t.duration, value: durationText },
    { label: t.type, value: sessionTypeLabel },
    { label: t.location, value: locationLabel },
    { label: withLabel, value: withName },
  ];

  return (
    <Html>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Preview>{previewText}</Preview>
        <Body
          className="bg-gray-50 font-sans text-base"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <Container className="mx-auto max-w-[600px]" style={{ backgroundColor: "#F9FAFB" }}>
            <Section style={{ paddingTop: "40px" }} />

            <Container
              className="rounded-[20px] bg-white"
              style={{
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                margin: "0 auto",
                padding: "48px 40px",
              }}
            >
              {/* Header */}
              <Section style={{ marginBottom: "32px" }}>
                <Row>
                  <Column align="center">
                    <Img
                      src="https://www.slovenscinakzk.com/logo-image.png"
                      alt="Slovenščina Korak za Korakom"
                      width={64}
                      height={64}
                      style={{ borderRadius: "16px" }}
                    />
                  </Column>
                </Row>
                <Section className="text-center" style={{ marginTop: "24px" }}>
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
                </Section>
              </Section>

              {/* Gradient accent line */}
              <Section
                style={{
                  height: "4px",
                  background:
                    "linear-gradient(90deg, #6089CB 0%, #A855F7 50%, #F9A8D4 100%)",
                  borderRadius: "2px",
                  marginBottom: "40px",
                }}
              />

              {/* Message */}
              <Section style={{ marginBottom: "24px" }}>
                <Text
                  style={{
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#374151",
                    margin: "0",
                  }}
                >
                  {messageText}
                </Text>
              </Section>

              {/* Details card */}
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

                {rows.map(({ label, value }, i) => (
                  <Row key={label} style={{ marginBottom: i < rows.length - 1 ? "16px" : "0" }}>
                    <Column style={{ width: "40%" }}>
                      <Text
                        style={{
                          fontSize: "13px",
                          lineHeight: "20px",
                          color: "#6B7280",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {label}
                      </Text>
                    </Column>
                    <Column style={{ width: "60%" }}>
                      <Text
                        style={{
                          fontSize: "15px",
                          lineHeight: "24px",
                          color: "#111827",
                          fontWeight: "500",
                          margin: "0",
                        }}
                      >
                        {value}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Section>

              {/* Footer note */}
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
            <Section style={{ padding: "40px 32px", textAlign: "center" }}>
              <Row>
                <Column align="center">
                  <table style={{ margin: "0 auto" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "0 12px" }}>
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
                        <td style={{ padding: "0 12px" }}>
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
                        <td style={{ padding: "0 12px" }}>
                          <Link
                            href="mailto:support@slovenscinakzk.com"
                            style={{
                              color: "#6B7280",
                              textDecoration: "none",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                            target="_self"
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

            <Section style={{ paddingBottom: "40px" }} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OneTimeSessionEmail;

OneTimeSessionEmail.PreviewProps = {
  tutorName: "Ana Novak",
  studentName: "Ivan Petrov",
  date: "Monday, 16 March 2026",
  startTime: "10:00",
  endTime: "11:00",
  duration: 60,
  sessionType: "individual",
  location: "online",
  recipientType: "student",
  // recipientType: "tutor",
  locale: "en",
} satisfies OneTimeSessionEmailProps;
