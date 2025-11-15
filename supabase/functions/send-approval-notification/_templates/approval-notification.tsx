import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ApprovalNotificationEmailProps {
  userName: string;
  rewardTitle: string;
  rewardId: string;
  appUrl: string;
}

export const ApprovalNotificationEmail = ({
  userName,
  rewardTitle,
  rewardId,
  appUrl,
}: ApprovalNotificationEmailProps) => {
  const rewardUrl = `${appUrl}/?reward=${rewardId}`;
  
  return (
    <Html>
      <Head />
      <Preview>Your reward submission has been approved and is now live!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Congratulations!</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Great news! Your reward submission "<strong>{rewardTitle}</strong>" has been approved 
            and is now live in the NCTR marketplace!
          </Text>
          <Section style={buttonContainer}>
            <Link href={rewardUrl} style={button}>
              View Your Reward
            </Link>
          </Section>
          <Text style={text}>
            Your reward is now available for other users to claim. Thank you for contributing 
            to the NCTR community!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, feel free to reach out to our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ApprovalNotificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const buttonContainer = {
  padding: '27px 40px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
};
