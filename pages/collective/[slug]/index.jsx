/* eslint-disable react/no-danger */
import React from 'react';
import Pluralize from 'pluralize';
import moment from 'moment';
import {
  Button, Image, Col, Row, Container, Card, Badge,
} from 'react-bootstrap';
import Link from 'next/link';
import Error from '../../../components/Error';
import ServerProps from '../../../lib/serverProps';
import Layout from '../../../components/layout';
import collectives from '../../../lib/collectives/CollectivesController';
import FundingSessions from '../../../lib/fundingSession/fundingSessionController';
import serializable from '../../../lib/serializable';
import middleware from '../../../middleware/all';
import CollectiveDonationCard from '../../../components/collective/CollectiveDonationCard';
import Icons from '../../../components/icons';
import CollectiveCard from '../../../components/collective/CollectiveCard';
import ShareButton from '../../../components/social/ShareButton';
import NominateBtn from '../../../components/collective/NominateBtn';
import FundingSessionInfo from '../../../components/fundingSession/FundingSessionInfo';
import Sponsors from '../../../components/fundingSession/Sponsors';
import Subscriptionform from '../../../components/SubscriptionForm';
import Currency from '../../../components/Currency';

const collectivePage = ({
  collective, state, 
  similar, sessions, 
  predicted, hasNominated,
  hostingUrl, finishedSession,
  
}) => {
  if (!collective) {
    return <Error statusCode={404} />;
  }

  const isInCurrentSession = state.current ? sessions?.reduce(
    (is, sess) => (sess._id === state.current._id ? true : is),
    false,
  ) : false;

  const {
    name, longDescription, imageUrl, slug, description,
    members, website, githubHandle, twitterHandle, shareImage,
  } = collective;

  const disbursments = finishedSession ? finishedSession.disbursments[collective.slug] : null;
  return (
    <div className="bg1">
      <Layout
        title={`FundOSS | ${!isInCurrentSession ? 'A new a way to support' : 'multiply your donations for'} ${name}`}
        state={state} 
        meta={{ 
          card: 'summary_large_image',
          img: shareImage ? hostingUrl + shareImage : `${hostingUrl}/api/image/collective/${slug}`,
          url: `${hostingUrl}/collective/${slug}`,
          description,
        }}
      >
        <Container>
          <Row style={{ padding: '40px 0' }}>
            <Col lg={{ span: 7 }} className="text-center text-lg-left">
              <Image width={80} src={imageUrl} fluid roundedCircle />
              <h1 className="display-4">{name}</h1>
              { website ? (
                <Button className="round" size="sm" variant="outline-secondary" target="_blank" href={website} style={{ marginRight: '10px' }}>
                  <Icons.Globe size={15} />
                </Button>
              ) : null }
              { twitterHandle ? (
                <Button className="round" size="sm" variant="outline-secondary" target="_blank" href={`https://twitter.com/${twitterHandle}`} style={{ marginRight: '10px' }}>
                  <Icons.Twitter size={15} />
                </Button>
              ) : null }
              { githubHandle ? (
                <Button className="round" size="sm" variant="outline-secondary" target="_blank" href={`https://github.com/${githubHandle}`}>
                  <Icons.Github size={15} />
                </Button>
              ) : null }

              &nbsp;<div className="d-block d-lg-none" />
              <span style={{ padding: '5px 0 0 10px' }} className="lead">Fiscal Host: Open Source Collective 501(c)(6)</span>
              <div className="collective-content" dangerouslySetInnerHTML={{ __html: longDescription }} style={{ padding: '20px 0' }} />
              {members.length ? (
                <><h3>Community</h3>
                  <div style={{ borderLeft: ' 5px solid #02E2AC', padding: '10px 0 10px 20px', marginBottom: '20px' }}>
                    <p>{collective.membersCount || members.length} {Pluralize('member', collective.membersCount || members.length)}</p>
                    {members.map(
                      (member, index) => (
                        <Image 
                          key={index}
                          src={member} 
                          roundedCircle
                          className="shadow-light" 
                          style={{ width: '35px', height: '35px', margin: '0 -10px 0 0' }} 
                        />
                      ),
                    )}
                  </div>
                </>
              ) : null }
            </Col>
            <Col>
              {isInCurrentSession ? (
                <CollectiveDonationCard 
                  collective={collective}
                  session={state.current}
                  predicted={predicted}
                />
              ) : null}
              {finishedSession && !isInCurrentSession ? (
                <Card>
                  <Card.Header className="text-center">
                    <p className="lead name text-center">
                      {finishedSession.name}&nbsp;ended <Badge variant="danger"> {moment(finishedSession.end).fromNow()}</Badge>

                    </p>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center">
                      {collective.totals && disbursments.total ? (
                        <div>
                          <h3>Thanks to you, {name} raised</h3>
                          <div>🎉
                            <span className="match display-3">
                              <Currency value={ disbursments.donation + disbursments.matched } floor />
                            </span>*🎉
                             
                          </div>
                          <b><Currency value={disbursments.donation} floor /></b>&nbsp;
                           from <b>{collective.totals?.donations.length}</b> {Pluralize('donor', collective.totals?.donations.length)} +&nbsp; 
                          <b className="text-success"><Currency value={disbursments.matched} floor /></b> match 
                          <br />*<small>-Stripe fees</small>
                        </div>
                      ) : null }

                    </div>

                  </Card.Body>
                  <Card.Footer>
                    <p className="text-center">Sign up to be notified for our next funding round.</p>
                    <Subscriptionform user={state.user} />
                  </Card.Footer>
                </Card>
              ) : null }
              {!isInCurrentSession && sessions.length && !finishedSession ? (
                <Card className="invert">
                  <Card.Header className="text-center content">
                    <FundingSessionInfo session={state.upcoming} size="sm" />
                    <Link href={`/session/${state.upcoming.slug}`}>
                      <Button size="lg" variant="outline-light">Find out more</Button>
                    </Link>
                  </Card.Header>
                  <Card.Body className="text-center content">
                    {state.upcoming.allowNominations 
                      ? (
                        <NominateBtn 
                          size="lg"
                          block
                          variant="outline-light"
                          nominated={hasNominated}
                          collective={collective}
                          session={state.upcoming}
                          user={state.user}
                        />
                      ) : null}
                    <p>Sign Up to be notified when you can support {name}</p>
                    <Subscriptionform user={state.user} />
                  </Card.Body>
                  <Card.Footer className="text-center content">

                    <Sponsors sponsors={state.upcoming.sponsors} align="center" /> 
                  </Card.Footer>
                </Card>
              ) : null}
              <Button className="airy" block size="sm" variant="light" target="_blank" href={`https://opencollective.com/${slug}`}>
                &nbsp;Support us on <img style={{ width: '120px' }} src="/static/open-collective.svg" alt="opensource collectives" />&nbsp;
              </Button>
              <div style={{ margin: '30px 0', padding: '10px' }}>
                <h3>Share This Project</h3>
                <p>Projects that get social boosts from donors have a higher&nbsp;
                  likelihood of hitting their fundraising needs each year.&nbsp;
                  Please considering lending your voice to support these OSS projects!
                </p>
                <ShareButton platform="twitter" variant="link" siteUrl={state.siteUrl} />
                <ShareButton platform="facebook" variant="link" siteUrl={state.siteUrl} />
                <ShareButton platform="email" variant="link" siteUrl={state.siteUrl} />
              </div>

            </Col>
          </Row>
          <Row />
        </Container>
        { similar?.length ? (
          <div className="similar">
            <Container>
              <h3>Similar Collectives</h3>
              <p>People who’ve backed {name} have also backed these projects...</p>
              <Row>
                { 
                  similar.map(
                    (collective) => (
                      <Col md={6} lg={4} key={collective.slug}>
                        <CollectiveCard active={isInCurrentSession} collective={collective} donateConfig={state.current.donateConfig} />
                      </Col>
                    ),
                  )
                }
              </Row>
            </Container>
          </div>
        ) : null}
      </Layout>
    </div>
  );
};

export async function getServerSideProps({ query, req, res }) {
  await middleware.run(req, res);
  const collective = await collectives.findBySlug(query.slug.toLowerCase());
  let finishedSession;
  if (collective) {
    const state = await ServerProps.getAppState(req.user, req.session.cart);
    const sessions = await FundingSessions.getCollectiveSessions(collective._id);

    if (state.current) {
      collective.totals = collective.sessionTotals.filter((t) => t.session == state.current._id)[0];
    }
    if (!state.current) { 
      finishedSession = await ServerProps.getFinished();
      if (finishedSession) {
        collective.totals = collective.sessionTotals.filter((t) => t.session == finishedSession._id)[0];
      }
    } 
    const hasNominated = req.user?._id 
      ? (await collectives.hasNominated(collective._id, state.upcoming._id, req.user?._id)) > 0
      : false;
    return {
      props: {
        state,
        hasNominated,
        collective: serializable(collective),
        similar: state.current ? serializable(
          await collectives.similar(state.current._id, [collective._id]),
        ) : false,
        sessions: serializable(sessions),
        hostingUrl: process.env.HOSTING_URL,
        finishedSession,
      },
    };
  }
  return { props: { collective } };
}

export default collectivePage;
