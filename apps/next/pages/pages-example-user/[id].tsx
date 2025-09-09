import { UserDetailScreen } from 'app/features/user/detail-screen';
import Head from 'next/head';
import { createParam } from 'solito';

const { useParam } = createParam<{ id: string }>();

export default function Page() {
  const [id] = useParam('id');

  if (!id) {
    return null;
  }

  return (
    <>
      <Head>
        <title>User</title>
      </Head>
      <UserDetailScreen id={id} />
    </>
  );
}
