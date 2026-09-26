import * as React from "react";
import { Html, Body, Container, Text } from "@react-email/components";

export const WelcomeEmail = () => {
  return (
    <Html>
      <Body>
        <Container>
          <Text>Hello world</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;
