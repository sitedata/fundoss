/* eslint-disable react/no-danger */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FormControl from 'react-bootstrap/FormControl';
import moment from 'moment';
import {
  Card, Image, Alert, Col, Row, Button, Container, Spinner, Nav, 
} from 'react-bootstrap';
import CollectiveCard from '../collective/CollectiveCard';
import FeaturedCollectiveCard from '../collective/FeaturedCollectiveCard';
import Sponsors from './Sponsors';
import Qf from '../../utils/qf';
import FundingSessionInfo from './FundingSessionInfo';
import Nominate from '../collective/NominateForm';
import AdminLinks from './AdminLinks';
import ShareButton from '../social/ShareButton';
import Subscriptionform from '../SubscriptionForm';
import CoinsAnimation from '../illustration/CoinsAnimation';
import Icons from '../icons';

const FundingSession = ({
  session, user, predicted, state, nominations = { user: [] }, featured,
}) => {
  const {
    name, description, collectives, start, end, sponsors, thanks,
  } = session;

  const [collectivesList, setCollectivesList] = useState(
    collectives.map((c) => ({ ...c })),
  );
  const [sort, setSort] = useState('desc');
  const [sortOn, setSortOn] = useState('random');
  const [display, setDisplay] = useState(3);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState(null);
  const started = moment() > moment(start);
  const ended = moment() > moment(end);
  const sessionInfo = collectives.reduce(
    (info, c) => ({ 
      match: info.match + (c.totals?.donations?.reduce(
        (total, d) => total + Qf.calculate(d),
        0,
      ) || 0),
      collectives: { ...info.collectives, ...{ [c._id]: c } },
    }),
    { match: 0, collectives: {} },
  );
  
  const featuredCollective = featured;
  
  const userDonations = user.donations ? Object.keys(user.donations).map(
    (key) => ({ collective: sessionInfo.collectives[key], amount: user.donations[key] }), 
  ) : null;

  let timer;
  const typeInSearch = (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      change({ search: value });
      return () => clearTimeout(timer);
    }, 500);
  };
  const change = (filters) => {
    if (filters.sort) setSort(filters.sort);
    if (filters.sortOn) setSortOn(filters.sortOn);
    if (filters.search !== undefined) setSearch(filters.search);
    if (filters.tags) setTags(filters.tags);
    let list = collectives;
    if (filters.search || (filters.search === undefined && search)) {
      const src = filters.search || search;
      list = collectives.filter((col) => col.name.toLowerCase().indexOf(src) > -1
      || col.description?.toLowerCase().indexOf(src) > -1
      || col.longDescription?.toLowerCase().indexOf(src) > -1
      || col.slug?.indexOf(src) > -1);
    }
    if (filters.tags?.length || (tags?.length && !filters.tags)) {
      const tagsFilter = filters.tags || tags;
      list = collectives.filter(
        (col) => {
          const found = col.tags?.reduce((found, tag) => tagsFilter.includes(tag) || found, false);
          return found;
        },
      );
    }
    if (filters.sortOn === 'amount' && (filters.sort || sort)) {
      const srt = filters.sort || sort;
      list = list.sort((a, b) => {
        let av; let bv;
        if (started) {
          av = parseInt(a.totals?.amount, 10); 
          bv = parseInt(b.totals?.amount, 10);
        } else {
          av = nominations[a._id] || 0;
          bv = nominations[b._id] || 0;
        }

        return srt === 'asc' ? av - bv : bv - av;
      });
    }
    if (filters.sortOn === 'amount' && (filters.sort || sort)) {
      const srt = filters.sort || sort;
      list = list.sort((a, b) => {
        let av; let bv;
        if (started) {
          av = parseInt(a.totals?.amount, 10); 
          bv = parseInt(b.totals?.amount, 10);
        } else {
          av = nominations[a._id] || 0;
          bv = nominations[b._id] || 0;
        }

        return srt === 'asc' ? av - bv : bv - av;
      });
    }

    if (filters.sortOn === 'random') list = list.sort(() => 0.5 - Math.random());

    setCollectivesList(list);
  };

  const srollTimeout = () => setTimeout(() => {
    clearTimeout(scrollTimer);
    if (displayMore(window.document)) showMoreCollectives();
  }, 300);
  const displayMore = (doc) => currentDisplay < collectives.length 
    && doc.getElementById('collectives')?.offsetHeight + doc.body.getBoundingClientRect().y < 1000;

  let scrollTimer;
  let currentDisplay = display;

  const showMoreCollectives = () => {
    clearTimeout(scrollTimer);
    currentDisplay += 3;
    setDisplay(currentDisplay);
    window.addEventListener('scroll', () => scrollTimer = srollTimeout());
    if (currentDisplay < collectives.length) scrollTimer = srollTimeout();
  };

  useEffect(() => {
    srollTimeout();
    return () => clearTimeout(scrollTimer);
  }, []);

  return (
    <>
      <div
        className="session-header"
        style={{
          padding: '50px 0 60px',
        }}
      >
        <CoinsAnimation
          className="d-none d-md-block"
          width={300}
          height={450}
          num={10}
          style={{
            position: 'absolute', zIndex: -10, width: '600px', height: '450px', top: '-50px',
          }}
        />
        <CoinsAnimation
          className="d-none d-md-block"
          width={100}
          height={450}
          num={5}
          flip
          style={{
            position: 'absolute', zIndex: -10, width: '200px', height: '450px', top: '-50px', right: 0,
          }}
        />
        <Container>
          <Row className="align-items-center">
            {started && !ended ? (
              <Col xs={{ order: 1, span: 4 }} className="d-none d-lg-block">
                <div style={{ maxWidth: '370px', margin: '0 auto' }}>
                
                  <FeaturedCollectiveCard 
                    collective={featuredCollective} 
                    active={started && !ended}
                    session={state.current}
                  />
                </div>
              </Col>
            ) : null}

            {!started || ended ? (
              <Col xs={{ order: 2, span: 12 }} lg={{ order: 1, span: 4 }}>
                <Card className="invert glass" style={{ maxWidth: '350px', margin: '10px auto' }}>
                  <Card.Body className="content text-center airy">
                    { session.allowNominations ? (<><Nominate sessionId={session._id} /><hr /></>) 
                      : null }
                    {ended 
                      ? <h3>Sign Up to be notified for our next round</h3> 
                      : <h3>Sign Up to be notified when {session.name} starts</h3> }
                    <Subscriptionform user={user} />
                    <p className="airy">
                      Do you want your project included in a future round?
                    </p>
                    <Button variant="link" block href="https://opencollective.com/create" target="_blank">
                      Create your collective on<br />
                      <img src="/static/sponsors/osc.svg" alt="Open Source Collectives" width="70%" style={{ margin: '10px auto' }} />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ) : null}

            <Col xs={{ order: 1, span: 12 }} lg={{ order: 2, span: 7, offset: 1 }} className="content text-center text-lg-left">
              <FundingSessionInfo session={session} predicted={predicted} />
              {user.role === 'admin' ? <AdminLinks disbursments edit session={session} /> : null}
              {user.donations?.length 
                ? (
                  <div style={{ margin: '15px 0' }}>Your donnations : <br />{userDonations.map( 
                    (donation) => (
                      <Image 
                        width={30} 
                        height={30} 
                        key={donation.collective._id} 
                        src={donation.collective.imageUrl} 
                        roundedCircle 
                        fluid
                      />
                    ),
                  )}
                  </div>
                ) : (
                  <>
                    <div className="session-description" dangerouslySetInnerHTML={{ __html: ended ? thanks : description }} />
                    <p>
                      <Link href="/democratic-funding">Learn More about Democratic Funding</Link><br className="d-block d-sm-none" /> or share on   
                      <span>
                        <ShareButton platform="twitter" variant="link" siteUrl={state.siteUrl} />
                        <ShareButton platform="facebook" variant="link" siteUrl={state.siteUrl} />
                      </span>
                    </p>
                  </>
                )}

              <Sponsors sponsors={sponsors} className="text-md-left" />
            </Col>
          </Row>
          <div style={{ padding: '30px 0', marginBottom: '20px' }} className="text-center content">
            { started ? (
              <span>👇 Scroll to see the 
                other {collectives.length - 1} amazing 
                collectives we’re sustaining! 👇
              </span>
            ) : null }
            { !started && session.allowNominations ? (
              <span>
                👇 Nominate your favorite collectives 👇
              </span>
            ) : null }

          </div>
        </Container>
      </div>
      <Container>
        <Card style={{ margin: '10px 0 28px', padding: '.75rem' }}>
          <Row className="no-gutters">
            <Col>
              <FormControl
                type="text"
                placeholder="Filter by name and description"
                className="mr-sm-2"
                onChange={(e) => typeInSearch(e.target.value.toLowerCase())}
                onKeyUp={(e) => typeInSearch(e.target.value.toLowerCase())}
              />
            </Col>
            { started ? (
              <Col xs={4} lg={4} className="text-center">
                
                <Nav className="justify-content-center sort" activeKey={sortOn} >
                  <Nav.Link disabled className="d-none d-md-inline">Sort</Nav.Link>
                  <Nav.Link
                    eventKey="random" 
                    onClick={() => change({ sort: 'none', sortOn: 'random' })}
                  >
                    <Icons.Random size={13} />&nbsp;
                    <span className="d-none d-lg-inline">Random</span>
                  </Nav.Link>
                  <Nav.Link
                    eventKey="amount"
                    onClick={() => change({ sort: sort === 'desc' ? 'asc' : 'desc', sortOn: 'amount' })}
                  >{sort === 'asc' ? '↑' : '↓'}&nbsp;
                    <span className="d-inline d-md-none">💰</span>
                    <span className="d-none d-md-inline">Funding</span>
                  </Nav.Link>
                </Nav>
              </Col>
            ) : null}
            { !started && session.allowNominations ? (
              <Col xs={4} lg={2} className="text-center">
                <div className="sort"><small className="d-none d-md-inline">Sort by</small>
                  <Button 
                    size="sm"
                    style={{ margin: '0 10px' }}
                    onClick={() => change({ sort: sort === 'desc' ? 'asc' : 'desc' })} 
                    variant="link"
                  >
                    {sort === 'asc' ? (
                      <><span className="with-caret-up" />Votes</>
                    ) : (
                      <><span className="with-caret" />Votes</>
                    )}
                  </Button>
                </div>
              </Col>
            ) : null}
            { !started && !session.allowNominations ? (
              <Col xs={4} xl={3} lg={4} className="text-center">
                <Button
                  href="https://opencollective.com/fundoss"
                  target="_blank" 
                  variant="link"
                > 🔥🔥 Donate&nbsp;
                  <span className="d-none d-md-inline">to our matching pool</span>
                </Button>
              </Col>
            ) : null}
          </Row>
        </Card>
        {collectivesList.length ? (
          <Row id="collectives">{
          collectivesList.map(
            (collective, index) => { 
              if (index < display) {
                return (
                  <Col md={6} lg={4} key={collective.slug}>
                    <CollectiveCard 
                      collective={collective}
                      active={started && !ended}
                      nominate={!started && session.allowNominations}
                      nominations={nominations[collective._id]}
                      nominated={nominations.user.indexOf(collective._id) > -1}
                      session={session}
                      ended={ended}
                      donateConfig={state.current?.donateConfig}
                      user={user}
                    />
                  </Col>
                ); 
              }
              return <></>;
            },
          )
        }
          </Row>
        ) : null}

        {!collectivesList.length ? <Alert variant="info">No collectives found</Alert> : null}
        {collectivesList.length > display ? <div className="text-center"><Spinner animation="border" variant="light" /></div> : null}
      </Container>
    </>
  );
};

export default FundingSession;
