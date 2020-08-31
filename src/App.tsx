import React, { useState, useEffect } from "react";
import "./App.css";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Button,
  Modal,
  Form,
} from "react-bootstrap";

interface UserInterface {
  id: number;
  name: string;
  email: string;
  password: string;
}

const client = new ApolloClient({
  uri: "http://172.20.113.112:8080/graphql",
  cache: new InMemoryCache(),
});

const GET_USERS = gql`
  {
    users {
      id
      name
      email
      password
    }
  }
`;

const ADD_USER = gql`
  mutation addUser($name: String!, $email: String!, $password: String!) {
    addUser(name: $name, email: $email, password: $password) {
      id
      name
      email
      password
    }
  }
`;

const UPDATE_USER = gql`
  mutation updateUser(
    $id: ID
    $name: String!
    $email: String!
    $password: String!
  ) {
    updateUser(id: $id, name: $name, email: $email, password: $password) {
      id
      name
      email
      password
    }
  }
`;

const UsuarioForm = (props: {
  show: boolean;
  closeModal: () => void;
  user?: UserInterface;
}) => {
  let name: HTMLInputElement;
  let email: HTMLInputElement;
  let password: HTMLInputElement;

  const [updateUser] = useMutation(UPDATE_USER);
  const [addUser] = useMutation(ADD_USER, {
    update(cache, { data: { addUser } }) {
      cache.modify({
        fields: {
          users(existingUsers: []) {
            const newUserRef = cache.writeFragment({
              data: addUser,
              fragment: gql`
                fragment NewUser on Users {
                  id
                  name
                  email
                  password
                }
              `,
            });
            return [newUserRef, ...existingUsers];
          },
        },
      });
    },
  });
  const { show, closeModal, user } = props;

  useEffect(() => {
    if (user) {
      name.value = user.name;
      email.value = user.email;
      password.value = user.password;
    }
  }, [user]);

  const onSubmit = (e: any) => {
    e.preventDefault();
    if (user) {
      updateUser({
        variables: {
          id: user?.id,
          name: name.value,
          email: email.value,
          password: password.value,
        },
      });
    } else {
      addUser({
        variables: {
          name: name.value,
          email: email.value,
          password: password.value,
        },
      });
    }
    closeModal();
  };

  return (
    <Modal show={show}>
      <Form onSubmit={onSubmit}>
        <Modal.Header>
          <Modal.Title>Ingresar usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="name">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              placeholder="Ingrese nombre de usuario"
              ref={(node: HTMLInputElement) => {
                name = node;
              }}
            />
          </Form.Group>
          <Form.Group controlId="email">
            <Form.Label>Correo Electronico</Form.Label>
            <Form.Control
              type="email"
              placeholder="Ingrese email"
              ref={(node: HTMLInputElement) => {
                email = node;
              }}
            />
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              placeholder="Ingrese contraseña"
              ref={(node: HTMLInputElement) => {
                password = node;
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => closeModal()}>
            Cerrar
          </Button>
          <Button variant="primary" type="submit">
            Guardar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const UsuariosList = (props: {
  handleEditUser: (user: UserInterface) => void;
}) => {
  const { loading, error, data } = useQuery(GET_USERS);
  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error {error.extraInfo}</p>;

  return data.users.map((user: UserInterface) => {
    const { id, name, email, password } = user;
    return (
      <ListGroupItem key={id}>
        <Row>
          <Col xs={10}>
            <p>
              <b>Nombre de usuario:</b> {name}
            </p>
            <p>
              <b>Correo Electronico:</b> {email}
            </p>
            <p>
              <b>Contraseña:</b> {password}
            </p>
          </Col>
          <Col xs={2}>
            <Button onClick={() => props.handleEditUser(user)}>
              Editar Usuario
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    );
  });
};

function App() {
  const [showModal, setShowModal] = useState(false);
  const [editableUser, setEditableUser] = useState<UserInterface | undefined>();
  const handleShowModal = () => setShowModal(true);
  const handleHideModal = () => setShowModal(false);

  return (
    <ApolloProvider client={client}>
      <Container>
        <UsuarioForm
          show={showModal}
          closeModal={() => {
            handleHideModal();
            setEditableUser(undefined);
          }}
          user={editableUser}
        />
        <ListGroup style={{ marginTop: 50 }}>
          <ListGroupItem variant="primary">
            <Row>
              <Col xs={10}>
                <h3>Lista de usuarios</h3>
              </Col>
              <Col xs={2}>
                <Button onClick={handleShowModal}>Nuevo usuario</Button>
              </Col>
            </Row>
          </ListGroupItem>
          <UsuariosList
            handleEditUser={(user) => {
              setEditableUser(user);
              handleShowModal();
            }}
          />
        </ListGroup>
      </Container>
    </ApolloProvider>
  );
}

export default App;
