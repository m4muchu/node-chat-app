const socket = io();

// elements

const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');

const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// templates

const messageTemplate = document.querySelector('#message-template').innerHTML;
const mapTemplate = document.querySelector('#google-map-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// options

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of the message container
  const containerHeight = $messages.scrollHeight;

  // how far I scrolled ?
  const scrollOfSet = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOfSet) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (payload) => {
  console.log(payload.text);

  const html = Mustache.render(messageTemplate, {
    username: payload.username,
    message: payload.text,
    createdAt: moment(payload.createdAt).format('h:mm a'),
  });

  $messages.insertAdjacentHTML('beforeend', html);

  autoScroll();
});

socket.on('locationMessage', (payload) => {
  console.log(payload.url);

  const html = Mustache.render(mapTemplate, {
    username: payload.username,
    url: payload.url,
    createdAt: moment(payload.createdAt).format('h:mm a'),
  });

  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  $sidebar.insertAdjacentHTML('beforeend', html);

  // $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageButton.setAttribute('disabled', 'true');

  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, (acknowledgementMessage) => {
    $messageButton.removeAttribute('disabled');
    $messageInput.value = '';
    $messageInput.focus();

    console.log('The message was delivered!', acknowledgementMessage);
  });
});

document.querySelector('#send-location').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('geolocation not supported');

  navigator.geolocation.getCurrentPosition((postition) => {
    const {
      coords: { longitude, latitude },
    } = postition;

    socket.emit('sendLocation', {
      latitude,
      longitude,
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
