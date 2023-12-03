AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 524744845066
AWS_PROFILE ?= efflux

STACK_NAME_PROD ?= Efflux-BE
STACK_NAME_STAGING ?= Efflux-BE-Staging

deploy-prod:
	@aws cloudformation deploy \
		--stack-name $(STACK_NAME_PROD) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
		--template-file be-template.yaml \
		--parameter-overrides \
			ProjectName=efflux \
			OperatorEmail=ilyas@ad.roi\
      RDSPostgresClusterPassword=eapsU6KlwrnUWswdZ9BWnY \
    --tags \
      project=efflux \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

deploy-staging:
  @aws cloudformation deploy \
    --stack-name $(STACK_NAME_STAGING) \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
    --template-file staging-template.yaml \
    --parameter-overrides \
			ProjectName=efflux-staging \
			OperatorEmail=ilyas@ad.roi\
      RDSPostgresClusterPassword=eapsU6KlwrnUWswdZ9BWnY \
    --tags \
      project=efflux-staging \
    --profile $(AWS_PROFILE) \
    --region $(AWS_REGION)

destroy-prod:
	@aws cloudformation delete-stack \
		--stack-name $(STACK_NAME_PROD) \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)

destroy-staging:
  @aws cloudformation delete-stack \
    --stack-name $(STACK_NAME_STAGING) \
    --profile $(AWS_PROFILE) \
    --region $(AWS_REGION)
