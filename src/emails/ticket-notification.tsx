import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface TicketNotificationEmailProps {
    ticketId: string
    title: string
    action: 'Created' | 'Assigned' | 'Updated' | 'SLA Warning' | 'SLA Breach' | 'Resolved' | 'Closed'
    message?: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const TicketNotificationEmail = ({
    ticketId,
    title,
    action,
    message,
}: TicketNotificationEmailProps) => {
    let actionColor = '#056BFC' // Blue Ribbon
    if (action === 'SLA Warning' || action === 'SLA Breach') actionColor = '#FABD00' // Sunset Strip for warning, could be red for breach
    if (action === 'SLA Breach') actionColor = '#EF4444' // Red
    if (action === 'Resolved' || action === 'Closed') actionColor = '#3FD534' // Apple Green

    const previewText = `Ticket ${ticketId} has been ${action.toLowerCase()}`

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src={`${baseUrl}/vm-logo.png`}
                            width="200"
                            alt="ValueMomentum"
                            style={logo}
                        />
                    </Section>

                    <Heading style={{ ...h1, color: actionColor }}>
                        Ticket {action}
                    </Heading>

                    <Text style={text}>
                        <strong>{ticketId}</strong>: {title}
                    </Text>

                    {message && (
                        <Text style={messageStyle}>
                            {message}
                        </Text>
                    )}

                    <Section style={buttonContainer}>
                        <Link href={`${baseUrl}/tickets/${ticketId}`} style={button}>
                            View Ticket
                        </Link>
                    </Section>

                    <Hr style={hr} />

                    <Text style={footer}>
                        ValueMomentum Ticketing System<br />
                        Please do not reply directly to this email.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

export default TicketNotificationEmail

const main = {
    backgroundColor: '#FBFBFB', // Alabaster
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
    backgroundColor: '#ffffff',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    marginTop: '40px',
}

const header = {
    padding: '24px 32px',
    backgroundColor: '#303030', // Black Cat
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
}

const logo = {
    margin: '0',
    filter: 'brightness(0) invert(1)', // Make it white on dark background
}

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '0 32px',
    margin: '24px 0 16px',
}

const text = {
    color: '#303030',
    fontSize: '16px',
    lineHeight: '26px',
    padding: '0 32px',
    margin: '0 0 16px',
}

const messageStyle = {
    color: '#303030',
    fontSize: '15px',
    lineHeight: '24px',
    padding: '16px 32px',
    backgroundColor: '#FBFBFB',
    borderLeft: '4px solid #056BFC',
    margin: '0 32px 24px',
}

const buttonContainer = {
    padding: '0 32px',
    margin: '24px 0',
}

const button = {
    backgroundColor: '#056BFC',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
}

const hr = {
    borderColor: '#eaeaea',
    margin: '32px 0 24px',
}

const footer = {
    color: '#898989',
    fontSize: '12px',
    lineHeight: '24px',
    padding: '0 32px',
}
